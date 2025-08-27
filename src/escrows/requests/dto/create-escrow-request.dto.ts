import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
	IsBoolean,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	Min,
} from "class-validator";

export class CreateEscrowRequestDto {
	@ApiProperty({ enum: ["sell", "buy"] })
	@IsEnum(["sell", "buy"])
	side!: "sell" | "buy";

	@ApiProperty({ description: "Creator public key" })
	@IsString()
	pubkey!: string;

	@ApiPropertyOptional({
		minimum: 0,
		description: "Amount in satoshis or your smallest unit",
	})
	@IsOptional()
	@IsNumber()
	@Min(0)
	amount?: number;

	@ApiProperty({ maxLength: 1000 })
	@IsString()
	@MaxLength(1000)
	description!: string;

	@ApiPropertyOptional({
		description: "Whether the request is visible on the public orderbook",
	})
	@IsOptional()
	@IsBoolean()
	public?: boolean;
}

export class EscrowRequestCreatedDto {
	@ApiProperty({ example: "q3f7p9n4z81k6c0b" })
	externalId!: string;

	@ApiProperty({
		example: "https://app.example/escrows/requests/q3f7p9n4z81k6c0b",
	})
	shareUrl!: string;
}

export class EscrowRequestGetDto {
	@ApiProperty({ enum: ["sell", "buy"] })
	side!: "sell" | "buy";

	@ApiPropertyOptional()
	amount?: number;

	@ApiProperty()
	description!: string;

	@ApiProperty()
	public!: boolean;

	@ApiProperty({
		description: "Unix epoch in milliseconds",
		example: 1732690234123,
	})
	createdAt!: number;
}

export class OrderbookItemDto {
	@ApiProperty({ example: "q3f7p9n4z81k6c0b" })
	externalId!: string;

	@ApiProperty({ enum: ["sell", "buy"] })
	side!: "sell" | "buy";

	@ApiProperty({ description: "Owner public key" })
	pubkey!: string;

	@ApiPropertyOptional()
	amount?: number;

	@ApiProperty()
	description!: string;

	@ApiProperty({
		description: "Unix epoch in milliseconds",
		example: 1732690234123,
	})
	createdAt!: number;
}
