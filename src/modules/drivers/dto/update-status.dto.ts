import { IsEnum } from 'class-validator';
import { DriverStatus } from '../entities/driver.entity';

export class UpdateStatusDto {
    @IsEnum(DriverStatus)
    status!: DriverStatus;
}