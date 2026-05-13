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
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // ✅ From platform-express
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { ProofService } from './proof.service';
import { UploadProofDto } from './dto/upload-proof.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
    @UseInterceptors(FileInterceptor('photo', {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        },
    }))
    async uploadPhoto(
        @CurrentUser('id') userId: string,
        @UploadedFile() file: UploadedFileType,
        @Body() body: UploadProofDto,
    ) {
        console.log('File received:', file ? 'YES' : 'NO');

        if (!file) {
            throw new BadRequestException(
                'No file uploaded. Make sure the field name is "photo"'
            );
        }

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

    // Alternative Base64 upload method (no multer needed)
    @Post('upload-photo-base64')
    async uploadPhotoBase64(
        @CurrentUser('id') userId: string,
        @Body() body: UploadProofDto & { photoBase64: string },
    ) {
        if (!body.photoBase64) {
            throw new BadRequestException('No photo data provided');
        }

        const base64Data = body.photoBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const file = {
            buffer,
            originalname: `photo_${Date.now()}.jpg`,
            size: buffer.length,
            mimetype: 'image/jpeg',
            fieldname: 'photo',
        };

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