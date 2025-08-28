import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type ApiPaginatedMeta = {
	nextCursor?: string;
	total: number;
};

export type ApiPaginatedEnvelope<T> = {
	data: T;
	meta: ApiPaginatedMeta;
};

export type ApiEnvelope<T> = {
	data: T;
};

export const envelope = <T>(data: T): ApiEnvelope<T> => ({
	data,
});

export const paginatedEnvelope = <T>(
	data: T,
	meta: ApiPaginatedMeta,
): ApiPaginatedEnvelope<T> => ({
	data,
	meta,
});

/**
 * Swagger-only DTOs to describe the envelope in responses.
 * We’ll compose them with `getSchemaPath` in controllers.
 */
export class ApiPaginatedMetaDto implements ApiPaginatedMeta {
	@ApiPropertyOptional({
		description:
			"Opaque cursor to fetch the next page. Omitted when there is no next page.",
		example: "MTczMjc5NDQ2NTAwMDoxMjM0NQ==",
	})
	nextCursor?: string;

	@ApiProperty({
		description: "Total number of items across all pages (for this query).",
		example: 42,
	})
	total!: number;
}

/** Placeholder “envelope” shell; `data` is overridden per-endpoint in controller schemas. */
export class ApiPaginatedEnvelopeShellDto<T> {
	@ApiProperty({
		description: "Payload for this endpoint (shape varies by route)",
	})
	data!: T;
}

/** Placeholder “envelope” shell; `data` is overridden per-endpoint in controller schemas. */
export class ApiEnvelopeShellDto<T> {
	@ApiProperty({
		description: "Payload for this endpoint (shape varies by route)",
	})
	data!: T;

	@ApiProperty({ type: () => ApiPaginatedMetaDto })
	meta!: ApiPaginatedMetaDto;
}
