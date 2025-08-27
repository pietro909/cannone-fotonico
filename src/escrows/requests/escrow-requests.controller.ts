import {
	Body,
	Controller,
	Get,
	Post,
	Param,
	Query,
	UseGuards,
} from "@nestjs/common";
import { UserFromJwt } from "@/auth/user.decorator";
import { EscrowRequestsService } from "./escrow-requests.service";
import {
	CreateEscrowRequestDto,
	EscrowRequestCreatedDto,
	EscrowRequestGetDto,
	OrderbookItemDto,
} from "./dto/create-escrow-request.dto";
import {
	type ApiEnvelope,
	envelope,
	ApiEnvelopeShellDto,
	ApiMetaDto,
} from "@/common/dto/envelopes";

import {
	ApiBearerAuth,
	ApiBody,
	ApiExtraModels,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiQuery,
	ApiTags,
	ApiUnauthorizedResponse,
	getSchemaPath,
} from "@nestjs/swagger";
import { AuthGuard } from "@/auth/auth.guard";

@ApiTags("Escrow Requests")
@ApiExtraModels(
	ApiEnvelopeShellDto,
	ApiMetaDto,
	EscrowRequestCreatedDto,
	EscrowRequestGetDto,
	OrderbookItemDto,
)
@Controller()
export class EscrowRequestsController {
	constructor(private readonly service: EscrowRequestsService) {}

	// POST /escrows/requests
	@ApiOperation({ summary: "Create an escrow request" })
	@ApiBearerAuth()
	@ApiBody({ type: CreateEscrowRequestDto })
	@ApiOkResponse({
		description: "Created successfully",
		schema: {
			allOf: [
				{ $ref: getSchemaPath(ApiEnvelopeShellDto) },
				{
					type: "object",
					properties: {
						data: { $ref: getSchemaPath(EscrowRequestCreatedDto) },
						meta: { $ref: getSchemaPath(ApiMetaDto) },
					},
					required: ["data", "meta"],
				},
			],
		},
	})
	@ApiUnauthorizedResponse({ description: "Missing/invalid JWT" })
	@UseGuards(AuthGuard)
	@Post("escrows/requests")
	async create(
		@Body() dto: CreateEscrowRequestDto,
		@UserFromJwt("userId") userId: string,
	): Promise<ApiEnvelope<EscrowRequestCreatedDto>> {
		const data = await this.service.create(dto, userId);
		return envelope(data, { total: 1 });
	}

	// GET /escrows/requests/:externalId
	@ApiOperation({
		summary:
			"Get a single escrow request by externalId (requires auth unless public and owned by caller)",
	})
	@ApiBearerAuth()
	@ApiOkResponse({
		description: "Escrow request",
		schema: {
			allOf: [
				{ $ref: getSchemaPath(ApiEnvelopeShellDto) },
				{
					type: "object",
					properties: {
						data: { $ref: getSchemaPath(EscrowRequestGetDto) },
						meta: { $ref: getSchemaPath(ApiMetaDto) },
					},
					required: ["data", "meta"],
				},
			],
		},
	})
	@ApiUnauthorizedResponse({ description: "Missing/invalid JWT" })
	@ApiForbiddenResponse({ description: "Not allowed to view this request" })
	@ApiNotFoundResponse({ description: "Escrow request not found" })
	@UseGuards(AuthGuard)
	@Get("escrows/requests/:externalId")
	async getOne(
		@Param("externalId") externalId: string,
		@UserFromJwt("userId") userId: string,
	): Promise<ApiEnvelope<EscrowRequestGetDto>> {
		const data = await this.service.getByExternalId(externalId, userId);
		return envelope(data, { total: 1 });
	}

	// GET /orderbook?cursor&limit
	@ApiOperation({
		summary: "Public orderbook of escrow requests (only public=true)",
	})
	@ApiQuery({
		name: "limit",
		required: false,
		description: "Max items to return (1–100)",
		schema: { type: "integer", minimum: 1, maximum: 100, example: 20 },
	})
	@ApiQuery({
		name: "cursor",
		required: false,
		description: "Opaque cursor from previous page",
		schema: { type: "string", example: "MTczMjc5NDQ2NTAwMDoxMjM0NQ==" },
	})
	@ApiOkResponse({
		description: "A page of public requests",
		schema: {
			allOf: [
				{ $ref: getSchemaPath(ApiEnvelopeShellDto) },
				{
					type: "object",
					properties: {
						data: {
							type: "array",
							items: { $ref: getSchemaPath(OrderbookItemDto) },
						},
						meta: { $ref: getSchemaPath(ApiMetaDto) },
					},
					required: ["data", "meta"],
				},
			],
		},
	})
	@Get("orderbook")
	async orderbook(
		@Query("limit") limit?: string,
		@Query("cursor") cursor?: string,
	): Promise<ApiEnvelope<OrderbookItemDto[]>> {
		const n = limit ? parseInt(limit, 10) : undefined;
		const { items, nextCursor, total } = await this.service.orderbook(
			n,
			cursor,
		);
		return envelope(items, { total, nextCursor });
	}
}
