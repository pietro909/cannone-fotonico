import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { hexToBytes } from "@noble/hashes/utils";
import { schnorr } from "@noble/secp256k1";
import type { Repository } from "typeorm";
import {
	ChallengePayload,
	createSignupChallenge,
	hashSignupPayload,
} from "../crypto/challenge";
import { normalizeToXOnly } from "../crypto/keys";
import { User } from "../users/user.entity";

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User) private readonly users: Repository<User>,
		private readonly jwt: JwtService,
	) {}

	async createSignupChallenge(publicKeyRaw: string, origin: string) {
		const publicKey = normalizeToXOnly(publicKeyRaw);
		const now = new Date();

		let user = await this.users.findOne({ where: { publicKey } });
		if (!user) {
			user = this.users.create({ publicKey });
		}

		const { id, payload, hashHex } = createSignupChallenge(origin);
		user.pendingChallenge = JSON.stringify(payload);
		user.challengeId = id;
		user.challengeExpiresAt = new Date(now.getTime() + CHALLENGE_TTL_MS);

		await this.users.save(user);

		return {
			challenge: payload,
			challengeId: id,
			hashToSignHex: hashHex,
			expiresAt: user.challengeExpiresAt.toISOString(),
		};
	}

	async verifySignup(
		publicKeyRaw: string,
		signatureHex: string,
		challengeId: string,
		origin: string,
	) {
		const publicKey = normalizeToXOnly(publicKeyRaw);

		const user = await this.users.findOne({ where: { publicKey } });
		if (!user || !user.pendingChallenge || !user.challengeId) {
			throw new UnauthorizedException("No pending challenge");
		}
		if (user.challengeId !== challengeId) {
			throw new UnauthorizedException("Challenge mismatch");
		}
		if (!user.challengeExpiresAt || user.challengeExpiresAt < new Date()) {
			throw new UnauthorizedException("Challenge expired");
		}

		let payload: ChallengePayload | undefined;
		try {
			payload = JSON.parse(user.pendingChallenge);
		} catch {
			throw new InternalServerErrorException("Corrupt challenge");
		}
		if (payload?.origin !== origin || payload?.type !== "signup") {
			throw new UnauthorizedException("Invalid challenge domain");
		}

		const hashHex = hashSignupPayload(payload);
		let ok = false;
		try {
			ok = schnorr.verify(
				hexToBytes(signatureHex),
				hexToBytes(hashHex),
				hexToBytes(publicKey),
			);
		} catch (_e: unknown) {
			throw new BadRequestException("Invalid signature input");
		}
		if (!ok) {
			throw new UnauthorizedException("Invalid signature");
		}

		user.pendingChallenge = null;
		user.challengeId = null;
		user.challengeExpiresAt = null;
		user.lastLoginAt = new Date();
		await this.users.save(user);

		const accessToken = await this.jwt.signAsync({
			sub: user.id,
			publicKey: user.publicKey,
		});
		return { accessToken, userId: user.id, publicKey: user.publicKey };
	}
}
