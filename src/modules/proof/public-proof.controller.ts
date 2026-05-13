import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('public')
export class PublicProofController {
    @Get('proof-image/:filename')
    async getProofFile(
        @Param('filename') filename: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        try {
            const filePath = join(process.cwd(), 'uploads/proofs', filename);
            const file = createReadStream(filePath);

            const ext = filename.split('.').pop()?.toLowerCase();
            let contentType = 'image/jpeg';
            if (ext === 'png') contentType = 'image/png';
            if (ext === 'gif') contentType = 'image/gif';

            res.set({
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
            });
            return new StreamableFile(file);
        } catch (error) {
            res.status(404).json({ message: 'File not found' });
        }
    }
}