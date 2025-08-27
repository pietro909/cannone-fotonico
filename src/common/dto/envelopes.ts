import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class EmptyDataEnvelope {
	data: Record<string, never> = {};
}

export class ErrorResponse {
	errors!: string[];
}

export type ApiMeta = {
	nextCursor?: string;
	total: number;
};

export type ApiEnvelope<T> = {
	data: T;
	meta: ApiMeta;
};

export const envelope = <T>(data: T, meta: ApiMeta): ApiEnvelope<T> => ({
	data,
	meta,
});

/**
 * Swagger-only DTOs to describe the envelope in responses.
 * We’ll compose them with `getSchemaPath` in controllers.
 */
export class ApiMetaDto implements ApiMeta {
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
export class ApiEnvelopeShellDto {
	@ApiProperty({
		description: "Payload for this endpoint (shape varies by route)",
	})
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data!: any;

	@ApiProperty({ type: () => ApiMetaDto })
	meta!: ApiMetaDto;
}
