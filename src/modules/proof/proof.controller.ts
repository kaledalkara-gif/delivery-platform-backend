// src/modules/proof/proof.controller.ts

import {
    Controller,
    Post,
    Get,
    Param,
    UseInterceptors,
    UploadedFile,
    Body,
    UseGuards,
    Res,
    StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { ProofService } from './proof.service';
import { UploadProofDto } from './dto/upload-proof.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// ✅ Simple type definition for uploaded file
interface UploadedFileType {
    buffer: Buffer;
    originalname: string;
    size: number;
    mimetype: string;
    fieldname: string;
}

@Controller('proof')
@UseGuards(JwtAuthGuard)
export class ProofController {
    constructor(private readonly proofService: ProofService) { }

    @Post('upload-photo')
    @UseInterceptors(FileInterceptor('photo'))
    async uploadPhoto(
        @CurrentUser('id') userId: string,
        @UploadedFile() file: UploadedFileType, // ✅ FIXED: Use custom interface
        @Body() body: UploadProofDto,
    ) {
        const proof = await this.proofService.uploadPhoto(
            body.orderId,
            file,
            body.recipientName,
            body.recipientPhone,
            body.notes,
        );
        return {
            success: true,
            message: 'Photo uploaded successfully',
            data: proof,
        };
    }

    @Post('upload-signature')
    async uploadSignature(
        @CurrentUser('id') userId: string,
        @Body() body: UploadProofDto & { signatureData: string },
    ) {
        const proof = await this.proofService.uploadSignature(
            body.orderId,
            body.signatureData,
            body.recipientName,
            body.recipientPhone,
        );
        return {
            success: true,
            message: 'Signature saved successfully',
            data: proof,
        };
    }

    @Get('order/:orderId')
    async getOrderProofs(
        @CurrentUser('id') userId: string,
        @Param('orderId') orderId: string,
    ) {
        const proofs = await this.proofService.getProofsForOrder(orderId);
        return {
            success: true,
            data: proofs,
        };
    }

    @Get('file/:filename')
    async getProofFile(
        @Param('filename') filename: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const filePath = join(process.cwd(), 'uploads/proofs', filename);
        const file = createReadStream(filePath);
        res.set({
            'Content-Type': 'image/png',
            'Content-Disposition': `inline; filename="${filename}"`,
        });
        return new StreamableFile(file);
    }

    @Post('order/:orderId/complete')
    async completeOrderWithProof(
        @CurrentUser('id') userId: string,
        @Param('orderId') orderId: string,
        @Body() body: { proofId: string },
    ) {
        // Note: You may want to fetch the actual driverId from the database
        // using the userId. For now, using userId as driverId (simplified)
        const driverId = userId;
        const order = await this.proofService.markOrderDeliveredWithProof(
            orderId,
            driverId,
            body.proofId,
        );
        return {
            success: true,
            message: 'Order marked as delivered',
            data: order,
        };
    }
}