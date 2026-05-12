import {
    IsString,
    IsNumber,
    IsOptional,
    IsArray,
    ValidateNested,
    IsBoolean,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

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
    @Min(-90)
    @Max(90)
    latitude!: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
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
    @IsString()
    deliveryMode!: 'express_direct' | 'standard_depot';

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

    @IsString()
    @IsOptional()
    timeWindowPreference?: 'asap' | 'specific';

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