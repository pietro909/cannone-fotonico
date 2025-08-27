import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { type Repository, LessThan, Brackets } from "typeorm";
import { customAlphabet } from "nanoid";
import { EscrowRequest } from "./escrow-request.entity";
import type {
	CreateEscrowRequestDto,
	EscrowRequestCreatedDto,
	EscrowRequestGetDto,
	OrderbookItemDto,
} from "./dto/create-escrow-request.dto";
import { ConfigService } from "@nestjs/config";
import { User } from "@/users/user.entity";

const generateNanoid = customAlphabet(
	"0123456789abcdefghijklmnopqrstuvwxyz",
	16,
);

@Injectable()
export class EscrowRequestsService {
	private readonly shareBase: string;

	constructor(
		@InjectRepository(EscrowRequest)
		private readonly escrowRequestRepository: Repository<EscrowRequest>,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		private readonly config: ConfigService,
	) {
		// SHARE_BASE_URL like: https://app.example/escrows/requests
		this.shareBase =
			this.config.get<string>("SHARE_BASE_URL") ??
			"http://localhost:3000/escrows/requests";
	}

	async create(
		dto: CreateEscrowRequestDto,
		jwtUserId: string,
	): Promise<EscrowRequestCreatedDto> {
		const user = await this.userRepository.findOne({
			where: { publicKey: dto.pubkey },
		});
		if (user === null) {
			throw new ForbiddenException("pubkey mismatch");
		}
		if (user.pendingChallenge) {
			throw new ForbiddenException("pubkey is pending challenge");
		}
		if (user.challengeExpiresAt && user.challengeExpiresAt < new Date()) {
			throw new ForbiddenException("pubkey is expired challenge");
		}
		if (user.publicKey !== dto.pubkey) {
			throw new ForbiddenException("pubkey mismatch");
		}
		const externalId = generateNanoid();
		const entity = this.escrowRequestRepository.create({
			externalId,
			side: dto.side,
			pubkey: dto.pubkey,
			amount: dto.amount ?? null,
			description: dto.description,
			public: dto.public ?? false,
		});
		await this.escrowRequestRepository.save(entity);
		return {
			externalId,
			shareUrl: `${this.shareBase}/${externalId}`,
		};
	}

	async getByExternalId(
		externalId: string,
		jwtUserId: string,
	): Promise<EscrowRequestGetDto> {
		const found = await this.escrowRequestRepository.findOne({
			where: { externalId },
		});
		if (!found) throw new NotFoundException("Escrow request not found");

		const isOwner = found.pubkey === jwtUserId;
		if (!found.public && !isOwner) {
			throw new ForbiddenException("Not allowed to view this request");
		}

		return {
			side: found.side as "sell" | "buy",
			amount: found.amount ?? undefined,
			description: found.description,
			public: found.public,
			createdAt: found.createdAt.getTime(),
		};
	}

	/*
	 * Cursor is base64(`${createdAtMs}:${id}`).
	 * Returns the current page and the nextCursor (if more items exist), plus total public items.
	 */
	async orderbook(
		limit = 20,
		cursor?: string,
	): Promise<{
		items: OrderbookItemDto[];
		nextCursor?: string;
		total: number;
	}> {
		let createdBefore: number | undefined;
		let idBefore: number | undefined;

		if (cursor) {
			try {
				const raw = Buffer.from(cursor, "base64").toString("utf8");
				// cursor format: `${createdAtMs}:${id}`
				const [tsStr, idStr] = raw.split(":");
				const ts = Number(tsStr);
				const idNum = Number(idStr);
				if (Number.isFinite(ts)) createdBefore = ts;
				if (Number.isFinite(idNum)) idBefore = idNum;
			} catch {
				/* ignore malformed cursor */
			}
		}

		const take = Math.min(Math.max(limit ?? 1, 1), 100);

		const qb = this.escrowRequestRepository
			.createQueryBuilder("r")
			.where("r.public = :pub", { pub: true });

		if (createdBefore !== undefined && idBefore !== undefined) {
			qb.andWhere(
				new Brackets((w) => {
					w.where("r.createdAt < :createdBefore", {
						createdBefore: new Date(createdBefore),
					}).orWhere(
						new Brackets((w2) => {
							w2.where("r.createdAt = :createdAtEq", {
								createdAtEq: new Date(createdBefore),
							}).andWhere("r.id < :idBefore", { idBefore });
						}),
					);
				}),
			);
		}

		const rows = await qb
			.orderBy("r.createdAt", "DESC")
			.addOrderBy("r.id", "DESC")
			.take(take)
			.getMany();

		const total = await this.escrowRequestRepository.count({
			where: { public: true },
		});

		let nextCursor: string | undefined;
		if (rows.length === take) {
			const last = rows[rows.length - 1];
			nextCursor = EscrowRequestsService.makeCursor(last.createdAt, last.id);
		}

		const items: OrderbookItemDto[] = rows.map((r) => ({
			externalId: r.externalId,
			side: r.side as "sell" | "buy",
			pubkey: r.pubkey,
			amount: r.amount ?? undefined,
			description: r.description,
			createdAt: r.createdAt.getTime(),
		}));

		return { items, nextCursor, total };
	}

	static makeCursor(createdAt: Date, id: number): string {
		return Buffer.from(`${createdAt.getTime()}:${id}`, "utf8").toString(
			"base64",
		);
	}
}
