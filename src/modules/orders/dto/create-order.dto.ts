import {
    IsString,
    IsNumber,
    IsOptional,
    IsEnum,
    IsUUID,
    Min,
    Max,
    IsArray,
    ValidateNested,
    IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryMode, TimeWindowPreference } from '../entities/order.entity';

export class PackageDto {
    @IsString()
    type!: string;

    @IsNumber()
    @Min(1)
    lengthCm!: number;

    @IsNumber()
    @Min(1)
    widthCm!: number;

    @IsNumber()
    @Min(1)
    heightCm!: number;

    @IsNumber()
    @Min(0.01)
    weightKg!: number;

    @IsBoolean()
    @IsOptional()
    isFragile?: boolean;

    @IsBoolean()
    @IsOptional()
    isPerishable?: boolean;

    @IsString()
    @IsOptional()
    description?: string;
}

export class AddressDto {
    @IsString()
    address!: string;

    @IsNumber()
    latitude!: number;

    @IsNumber()
    longitude!: number;

    @IsString()
    @IsOptional()
    contactName?: string;

    @IsString()
    @IsOptional()
    contactPhone?: string;

    @IsString()
    @IsOptional()
    instructions?: string;
}

export class CreateOrderDto {
    @IsEnum(DeliveryMode)
    deliveryMode!: DeliveryMode;

    @ValidateNested()
    @Type(() => AddressDto)
    pickup!: AddressDto;

    @ValidateNested()
    @Type(() => AddressDto)
    dropoff!: AddressDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PackageDto)
    packages!: PackageDto[];

    @IsEnum(TimeWindowPreference)
    @IsOptional()
    timeWindowPreference?: TimeWindowPreference;

    @IsString()
    @IsOptional()
    pickupEarliestTime?: string;

    @IsString()
    @IsOptional()
    pickupLatestTime?: string;

    @IsString()
    @IsOptional()
    deliveryEarliestTime?: string;

    @IsString()
    @IsOptional()
    deliveryLatestTime?: string;
}