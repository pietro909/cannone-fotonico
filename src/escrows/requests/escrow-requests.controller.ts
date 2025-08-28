import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Query,
	UseGuards,
} from "@nestjs/common";
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
import { AuthGuard } from "../../auth/auth.guard";
import { UserFromJwt } from "../../auth/user.decorator";
import {
	type ApiEnvelope,
	ApiEnvelopeShellDto,
	ApiPaginatedMetaDto,
	ApiPaginatedEnvelopeShellDto,
	envelope,
	paginatedEnvelope,
} from "../../common/dto/envelopes";
import {
	CreateEscrowRequestDto,
	EscrowRequestCreatedDto,
	EscrowRequestGetDto,
	OrderbookItemDto,
} from "./dto/create-escrow-request.dto";
import { EscrowRequestsService } from "./escrow-requests.service";
import {User} from "../../users/user.entity";

@ApiTags("Escrow Requests")
@ApiExtraModels(
	ApiEnvelopeShellDto,
	ApiPaginatedMetaDto,
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
					},
					required: ["data"],
				},
			],
		},
	})
	@ApiUnauthorizedResponse({ description: "Missing/invalid JWT" })
	@UseGuards(AuthGuard)
	@Post("api/v1/escrows/requests")
	async create(
		@Body() dto: CreateEscrowRequestDto,
		@UserFromJwt() user: User,
	): Promise<ApiEnvelope<EscrowRequestCreatedDto>> {
		const data = await this.service.create(dto, user.publicKey);
		return envelope(data);
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
					},
					required: ["data"],
				},
			],
		},
	})
	@ApiUnauthorizedResponse({ description: "Missing/invalid JWT" })
	@ApiForbiddenResponse({ description: "Not allowed to view this request" })
	@ApiNotFoundResponse({ description: "Escrow request not found" })
	@UseGuards(AuthGuard)
	@Get("api/v1/escrows/requests/:externalId")
	async getOne(
		@Param("externalId") externalId: string,
        @UserFromJwt() user: User,
    ): Promise<ApiEnvelope<EscrowRequestGetDto>> {
		const data = await this.service.getByExternalId(externalId, user.publicKey);
		return envelope(data);
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
				{ $ref: getSchemaPath(ApiPaginatedEnvelopeShellDto) },
				{
					type: "object",
					properties: {
						data: {
							type: "array",
							items: { $ref: getSchemaPath(OrderbookItemDto) },
						},
						meta: { $ref: getSchemaPath(ApiPaginatedMetaDto) },
					},
					required: ["data", "meta"],
				},
			],
		},
	})
	@Get("api/v1/orderbook")
	async orderbook(
		@Query("limit") limit?: string,
		@Query("cursor") cursor?: string,
	): Promise<ApiEnvelope<OrderbookItemDto[]>> {
		const n = limit ? parseInt(limit, 10) : undefined;
		const { items, nextCursor, total } = await this.service.orderbook(
			n,
			cursor,
		);
		return paginatedEnvelope(items, { total, nextCursor });
	}
}
