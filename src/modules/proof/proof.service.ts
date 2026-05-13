// src/modules/proof/proof.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto'; // ✅ FIXED: Use randomUUID instead of v4
import { Proof, ProofType } from './entities/proof.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
    NotificationType,
    NotificationChannel,
    NotificationPriority  // ✅ FIXED: Added missing import
} from '../notifications/entities/notification.entity';

@Injectable()
export class ProofService {
    private readonly uploadDir = './uploads/proofs';

    constructor(
        @InjectRepository(Proof)
        private proofRepository: Repository<Proof>,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        private notificationsService: NotificationsService,
    ) {
        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async uploadPhoto(
        orderId: string,
        file: { buffer: Buffer; originalname: string; size: number; mimetype: string }, // ✅ FIXED: Use simple type instead of Multer
        recipientName?: string,
        recipientPhone?: string,
        notes?: string,
    ): Promise<Proof> {
        // Verify order exists
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user'],
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const fileName = `${randomUUID()}${fileExtension}`; // ✅ FIXED: Use randomUUID
        const filePath = path.join(this.uploadDir, fileName);
        const fileUrl = `/uploads/proofs/${fileName}`;

        // Save file to disk
        fs.writeFileSync(filePath, file.buffer);

        // Create proof record
        const proof = this.proofRepository.create({
            orderId,
            type: ProofType.PHOTO,
            fileUrl,
            fileName,
            fileSize: file.size,
            mimeType: file.mimetype,
            recipientName: recipientName || null,
            recipientPhone: recipientPhone || null,
            notes: notes || null,
            capturedAt: new Date(),
        });

        await this.proofRepository.save(proof);

        return proof;
    }

    async uploadSignature(
        orderId: string,
        signatureData: string,
        recipientName?: string,
        recipientPhone?: string,
    ): Promise<Proof> {
        // Verify order exists
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user'],
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Convert base64 signature to file
        const base64Data = signatureData.replace(/^data:image\/png;base64,/, '');
        const fileName = `${randomUUID()}_signature.png`; // ✅ FIXED: Use randomUUID
        const filePath = path.join(this.uploadDir, fileName);
        const fileUrl = `/uploads/proofs/${fileName}`;

        // Save signature as PNG
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        // Create proof record
        const proof = this.proofRepository.create({
            orderId,
            type: ProofType.SIGNATURE,
            fileUrl,
            fileName,
            fileSize: fs.statSync(filePath).size,
            mimeType: 'image/png',
            recipientName: recipientName || null,
            recipientPhone: recipientPhone || null,
            capturedAt: new Date(),
        });

        await this.proofRepository.save(proof);

        return proof;
    }

    async getProofsForOrder(orderId: string): Promise<Proof[]> {
        return this.proofRepository.find({
            where: { orderId },
            order: { createdAt: 'DESC' },
        });
    }

    async getProofById(proofId: string): Promise<Proof> {
        const proof = await this.proofRepository.findOne({
            where: { id: proofId },
        });

        if (!proof) {
            throw new NotFoundException('Proof not found');
        }

        return proof;
    }

    async markOrderDeliveredWithProof(
        orderId: string,
        driverId: string,
        proofId: string,
    ): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, driverId },
            relations: ['user'],
        });

        if (!order) {
            throw new NotFoundException('Order not found or not assigned to you');
        }

        if (order.status === OrderStatus.DELIVERED) {
            throw new BadRequestException('Order already delivered');
        }

        const proof = await this.getProofById(proofId);

        if (proof.orderId !== orderId) {
            throw new BadRequestException('Proof does not belong to this order');
        }

        // Update order status
        order.status = OrderStatus.DELIVERED;
        order.deliveredAt = new Date();
        await this.orderRepository.save(order);

        // Send notification to customer
        await this.notificationsService.create({
            userId: order.user.id,
            orderId: order.id,
            type: NotificationType.DELIVERY_COMPLETED,
            title: 'Package Delivered',
            body: `Your package has been delivered${proof.recipientName ? ` to ${proof.recipientName}` : ''}.`,
            channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
            priority: NotificationPriority.NORMAL, // ✅ Now works with proper import
        });

        return order;
    }
}