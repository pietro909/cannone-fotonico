import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ minLength: 3 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @ApiPropertyOptional({ minLength: 8, maxLength: 16 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password?: string;
}