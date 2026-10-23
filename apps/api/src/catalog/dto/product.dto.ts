import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { genderEnum, type Gender } from '../../db/schema';

export class ProductQueryDto {
  @IsOptional() @IsString() @MaxLength(80) q?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsIn(genderEnum.enumValues) gender?: Gender;
  @IsOptional() @IsIn(['true', 'false']) featured?: 'true' | 'false';
  @IsOptional() @IsIn(['true', 'false']) isNew?: 'true' | 'false';
  @IsOptional() @IsIn(['true', 'false']) decant?: 'true' | 'false';
  @IsOptional() @IsIn(['true', 'false']) promo?: 'true' | 'false';
  @IsOptional() @IsIn(['relevance', 'new', 'price-asc', 'price-desc', 'name', 'popular']) sort?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) pageSize?: number;
}

export class AdminProductQueryDto extends ProductQueryDto {
  @IsOptional() @IsIn(['all', 'active', 'inactive']) status?: 'all' | 'active' | 'inactive';
}

export class UpsertProductDto {
  @IsString() @MinLength(2) @MaxLength(140) name: string;
  @IsUUID() categoryId: string;
  @IsOptional() @IsString() @MaxLength(160) slug?: string;
  @IsOptional() @IsUUID() brandId?: string | null;
  @IsOptional() @IsString() @MaxLength(280) shortDescription?: string | null;
  @IsOptional() @IsString() @MaxLength(6000) description?: string | null;
  @IsOptional() @IsString() @MaxLength(80) presentation?: string | null;
  @IsOptional() @IsIn(genderEnum.enumValues) gender?: Gender | null;
  @IsOptional() @IsInt() @Min(0) price?: number | null;
  @IsOptional() @IsInt() @Min(0) cashPrice?: number | null;
  @IsOptional() @IsInt() @Min(0) compareAtPrice?: number | null;
  @IsOptional() @IsBoolean() showPrice?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) notesTop?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) notesHeart?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) notesBase?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) highlights?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsObject() attributes?: Record<string, string> | null;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() isNew?: boolean;
  @IsOptional() @IsBoolean() hasDecant?: boolean;
  @IsOptional() @IsBoolean() available?: boolean;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  /** Ids de Media en el orden deseado */
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) imageIds?: string[];
}

export class BulkProductDto {
  @IsArray() @IsUUID('all', { each: true }) ids: string[];
  @IsIn(['activate', 'deactivate', 'feature', 'unfeature', 'available', 'unavailable', 'delete']) action: string;
}

import { PartialType } from '@nestjs/swagger';
export class UpdateProductDto extends PartialType(UpsertProductDto) {}
