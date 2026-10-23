import { IsArray, IsBoolean, IsHexColor, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpsertCategoryDto {
  @IsString() @MinLength(2) @MaxLength(60) name: string;
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  @IsOptional() @IsString() @MaxLength(120) tagline?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) description?: string | null;
  @IsOptional() @IsString() @MaxLength(40) icon?: string | null;
  @IsOptional() @IsHexColor() accent?: string | null;
  @IsOptional() @IsUUID() coverId?: string | null;
  @IsOptional() @IsUUID() parentId?: string | null;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpsertBrandDto {
  @IsString() @MinLength(1) @MaxLength(60) name: string;
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  @IsOptional() @IsString() @MaxLength(60) origin?: string | null;
  @IsOptional() @IsUUID() logoId?: string | null;
  @IsOptional() @IsBoolean() featured?: boolean;
}

export class ReorderDto {
  @IsArray() @IsUUID('all', { each: true }) ids: string[];
}

import { PartialType } from '@nestjs/swagger';
export class UpdateCategoryDto extends PartialType(UpsertCategoryDto) {}
export class UpdateBrandDto extends PartialType(UpsertBrandDto) {}
