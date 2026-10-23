import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { seasonEnum, type Season } from '../../db/schema';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class HoursSlotDto {
  @IsIn(seasonEnum.enumValues) season: Season;
  @IsInt() @Min(0) @Max(6) weekday: number;
  @Matches(HHMM, { message: 'Formato HH:MM' }) opens: string;
  @Matches(HHMM, { message: 'Formato HH:MM' }) closes: string;
}

export class ReplaceHoursDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => HoursSlotDto) slots: HoursSlotDto[];
}

export class SpecialDayDto {
  @IsDateString() date: string;
  @IsString() @MaxLength(80) label: string;
  @IsOptional() @IsBoolean() closed?: boolean;
  @IsOptional() @Matches(HHMM) opens?: string;
  @IsOptional() @Matches(HHMM) closes?: string;
}

export class UpdateSettingDto {
  @IsObject() value: Record<string, unknown>;
}

export class SeasonConfigDto {
  @IsOptional() @IsIn(['AUTO', 'REGULAR', 'SUMMER']) mode?: 'AUTO' | 'REGULAR' | 'SUMMER';
  /** Inicio de temporada de verano MM-DD */
  @IsOptional() @Matches(/^\d{2}-\d{2}$/) summerStart?: string;
  /** Fin de temporada de verano MM-DD */
  @IsOptional() @Matches(/^\d{2}-\d{2}$/) summerEnd?: string;
}
