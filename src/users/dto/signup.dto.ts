import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class SignUpDto {
  @ApiProperty({ minLength: 3 })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty()
  @IsString()
  publicKey!: string;

  @ApiProperty({ minLength: 8, maxLength: 16 })
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password!: string;
}