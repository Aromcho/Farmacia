import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { deliveryMethodEnum, orderStatusEnum, paymentMethodEnum, type DeliveryMethod, type OrderStatus, type PaymentMethod } from '../../db/schema';

export class OrderItemDto {
  @IsUUID() productId: string;
  @IsInt() @Min(1) @Max(50) quantity: number;
  @IsOptional() @IsString() @MaxLength(80) option?: string;
}

export class CreateOrderDto {
  @IsString() @MinLength(2) @MaxLength(80) customerName: string;
  @IsString() @Matches(/^[\d\s+()-]{6,20}$/, { message: 'Teléfono inválido' }) phone: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(200) address?: string;
  @IsOptional() @IsIn(deliveryMethodEnum.enumValues) deliveryMethod?: DeliveryMethod;
  @IsOptional() @IsIn(paymentMethodEnum.enumValues) paymentMethod?: PaymentMethod;
  @IsOptional() @IsString() @MaxLength(60) insurance?: string;
  @IsOptional() @IsString() @MaxLength(600) notes?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(40) @ValidateNested({ each: true }) @Type(() => OrderItemDto) items: OrderItemDto[];
  /** Campo trampa anti-spam: debe venir vacío */
  @IsOptional() @IsString() @MaxLength(0) website?: string;
}

export class UpdateOrderDto {
  @IsOptional() @IsIn(orderStatusEnum.enumValues) status?: OrderStatus;
  @IsOptional() @IsString() @MaxLength(1000) adminNotes?: string;
}

export class OrderQueryDto {
  @IsOptional() @IsIn(orderStatusEnum.enumValues) status?: OrderStatus;
  @IsOptional() @IsString() @MaxLength(60) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class CreateInquiryDto {
  @IsString() @MinLength(2) @MaxLength(80) name: string;
  @IsOptional() @IsString() @Matches(/^[\d\s+()-]{6,20}$/, { message: 'Teléfono inválido' }) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() @MinLength(4) @MaxLength(1200) message: string;
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsString() @MaxLength(0) website?: string;
}

export class UpdateInquiryDto {
  @IsBoolean() handled: boolean;
}
