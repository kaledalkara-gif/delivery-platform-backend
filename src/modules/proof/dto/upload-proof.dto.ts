import { IsEnum, IsString, IsOptional, IsUUID } from 'class-validator';
import { ProofType } from '../entities/proof.entity';

export class UploadProofDto {
    @IsUUID()
    orderId!: string;

    @IsEnum(ProofType)
    type!: ProofType;

    @IsString()
    @IsOptional()
    recipientName?: string;

    @IsString()
    @IsOptional()
    recipientPhone?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}