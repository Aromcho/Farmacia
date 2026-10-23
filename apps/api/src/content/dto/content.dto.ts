import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { bannerPlacementEnum, type BannerPlacement } from '../../db/schema';

export class HighlightItemDto {
  @IsUUID() mediaId: string;
  @IsOptional() @IsString() @MaxLength(400) caption?: string | null;
  @IsOptional() @IsUUID() productId?: string | null;
  @IsOptional() @IsString() @MaxLength(400) linkUrl?: string | null;
  @IsOptional() @IsInt() @Min(2000) @Max(20000) durationMs?: number;
}

export class UpsertHighlightDto {
  @IsString() @MinLength(1) @MaxLength(40) title: string;
  @IsOptional() @IsUUID() coverId?: string | null;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => HighlightItemDto) items?: HighlightItemDto[];
}
export class UpdateHighlightDto extends PartialType(UpsertHighlightDto) {}

export class UpsertBannerDto {
  @IsOptional() @IsIn(bannerPlacementEnum.enumValues) placement?: BannerPlacement;
  @IsOptional() @IsString() @MaxLength(60) eyebrow?: string | null;
  @IsString() @MinLength(2) @MaxLength(120) title: string;
  @IsOptional() @IsString() @MaxLength(240) subtitle?: string | null;
  @IsOptional() @IsString() @MaxLength(40) ctaLabel?: string | null;
  @IsOptional() @IsString() @MaxLength(300) ctaHref?: string | null;
  @IsOptional() @IsUUID() mediaId?: string | null;
  @IsOptional() @IsUUID() mobileMediaId?: string | null;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsDateString() startsAt?: string | null;
  @IsOptional() @IsDateString() endsAt?: string | null;
  @IsOptional() @IsInt() sortOrder?: number;
}
export class UpdateBannerDto extends PartialType(UpsertBannerDto) {}

export class UpsertInsurerDto {
  @IsString() @MinLength(2) @MaxLength(60) name: string;
  @IsOptional() @IsString() @MaxLength(140) fullName?: string | null;
  @IsOptional() @IsString() @MaxLength(240) note?: string | null;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}
export class UpdateInsurerDto extends PartialType(UpsertInsurerDto) {}

export class UpdatePostDto {
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() visible?: boolean;
  @IsOptional() @IsUUID() coverId?: string | null;
}
