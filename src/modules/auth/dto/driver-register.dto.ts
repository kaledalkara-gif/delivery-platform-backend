import { IsString, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { VehicleType } from '../../drivers/entities/driver.entity';

export class DriverRegisterDto {
    @IsString()
    userId!: string;  // The existing user ID (customer becomes driver)

    @IsEnum(VehicleType)
    vehicleType!: VehicleType;

    @IsString()
    @IsOptional()
    vehiclePlate?: string;

    @IsNumber()
    @Min(0)
    @Max(500)
    maxWeightKg?: number;

    @IsNumber()
    @Min(0)
    @Max(200000)
    maxVolumeCm3?: number;
}