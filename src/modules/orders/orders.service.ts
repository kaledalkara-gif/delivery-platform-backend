// src/modules/orders/orders.service.ts

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, DeliveryMode, TimeWindowPreference } from './entities/order.entity';
import { Package, PackageCondition, PackageType } from './entities/package.entity';
import { Shipment, ShipmentStatus } from './entities/shipment.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
// Import the notification enums
import {
    NotificationType,
    NotificationChannel,
    NotificationPriority
} from '../notifications/entities/notification.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(Package)
        private packageRepository: Repository<Package>,
        @InjectRepository(Shipment)
        private shipmentRepository: Repository<Shipment>,
        private notificationsService: NotificationsService,
    ) { }

    async createOrder(user: User, createDto: CreateOrderDto): Promise<Order> {
        // Calculate total volume and weight
        let totalVolumeCm3 = 0;
        let totalWeightKg = 0;

        for (const pkg of createDto.packages) {
            const volume = pkg.lengthCm * pkg.widthCm * pkg.heightCm;
            totalVolumeCm3 += volume;
            totalWeightKg += pkg.weightKg;
        }

        // Calculate distance between pickup and dropoff
        const distanceKm = this.calculateDistance(
            createDto.pickup.latitude,
            createDto.pickup.longitude,
            createDto.dropoff.latitude,
            createDto.dropoff.longitude,
        );

        // Calculate pricing
        const { totalAmount, driverEarnings, platformFee } = this.calculatePricing(
            createDto.deliveryMode,
            totalVolumeCm3,
            totalWeightKg,
            distanceKm,
        );

        // Convert time window preference from string to enum
        let timeWindowPreferenceEnum: TimeWindowPreference;
        if (createDto.timeWindowPreference === 'asap') {
            timeWindowPreferenceEnum = TimeWindowPreference.ASAP;
        } else {
            timeWindowPreferenceEnum = TimeWindowPreference.SPECIFIC;
        }

        // Convert delivery mode from string to enum
        const deliveryModeEnum = createDto.deliveryMode === 'express_direct'
            ? DeliveryMode.EXPRESS_DIRECT
            : DeliveryMode.STANDARD_DEPOT;

        // Create order
        const order = this.orderRepository.create({
            user: user,
            deliveryMode: deliveryModeEnum,
            status: OrderStatus.PENDING,
            pickupAddress: createDto.pickup.address,
            pickupLatitude: createDto.pickup.latitude,
            pickupLongitude: createDto.pickup.longitude,
            pickupInstructions: createDto.pickup.instructions,
            pickupContactName: createDto.pickup.contactName,
            pickupContactPhone: createDto.pickup.contactPhone,
            dropoffAddress: createDto.dropoff.address,
            dropoffLatitude: createDto.dropoff.latitude,
            dropoffLongitude: createDto.dropoff.longitude,
            dropoffInstructions: createDto.dropoff.instructions,
            dropoffContactName: createDto.dropoff.contactName,
            dropoffContactPhone: createDto.dropoff.contactPhone,
            timeWindowPreference: timeWindowPreferenceEnum,
            pickupEarliestTime: createDto.pickupEarliestTime ? new Date(createDto.pickupEarliestTime) : null,
            pickupLatestTime: createDto.pickupLatestTime ? new Date(createDto.pickupLatestTime) : null,
            deliveryEarliestTime: createDto.deliveryEarliestTime ? new Date(createDto.deliveryEarliestTime) : null,
            deliveryLatestTime: createDto.deliveryLatestTime ? new Date(createDto.deliveryLatestTime) : null,
            totalAmount,
            driverEarnings,
            platformFee,
        });

        const savedOrder = await this.orderRepository.save(order);

        // Create packages
        for (const pkgDto of createDto.packages) {
            let packageTypeEnum: PackageType;
            switch (pkgDto.type) {
                case 'envelope':
                    packageTypeEnum = PackageType.ENVELOPE;
                    break;
                case 'small_box':
                    packageTypeEnum = PackageType.SMALL_BOX;
                    break;
                case 'medium_box':
                    packageTypeEnum = PackageType.MEDIUM_BOX;
                    break;
                case 'large_carton':
                    packageTypeEnum = PackageType.LARGE_CARTON;
                    break;
                default:
                    packageTypeEnum = PackageType.SMALL_BOX;
            }

            const packageEntity = new Package();
            packageEntity.order = savedOrder;
            packageEntity.type = packageTypeEnum;
            packageEntity.lengthCm = pkgDto.lengthCm;
            packageEntity.widthCm = pkgDto.widthCm;
            packageEntity.heightCm = pkgDto.heightCm;
            packageEntity.volumeCm3 = pkgDto.lengthCm * pkgDto.widthCm * pkgDto.heightCm;
            packageEntity.weightKg = pkgDto.weightKg;
            packageEntity.isFragile = pkgDto.isFragile || false;
            packageEntity.isPerishable = pkgDto.isPerishable || false;
            packageEntity.description = pkgDto.description || null;
            packageEntity.conditionAtPickup = PackageCondition.GOOD;

            await this.packageRepository.save(packageEntity);
        }

        // Create initial shipment record
        const shipment = new Shipment();
        shipment.order = savedOrder;
        shipment.driver = null;
        shipment.status = ShipmentStatus.PENDING;
        shipment.originAddress = createDto.pickup.address;
        shipment.originLatitude = createDto.pickup.latitude;
        shipment.originLongitude = createDto.pickup.longitude;
        shipment.destinationAddress = createDto.dropoff.address;
        shipment.destinationLatitude = createDto.dropoff.latitude;
        shipment.destinationLongitude = createDto.dropoff.longitude;

        await this.shipmentRepository.save(shipment);

        // Send notification to user - NOW USING ENUMS ✅
        await this.notificationsService.create({
            userId: user.id,
            orderId: savedOrder.id,
            type: NotificationType.ORDER_CREATED,      // ✅ Enum, not string
            title: 'Order Created',
            body: `Your order #${savedOrder.id.slice(0, 8)} has been created successfully.`,
            channels: [NotificationChannel.PUSH, NotificationChannel.SMS],  // ✅ Enum array
            priority: NotificationPriority.NORMAL,     // ✅ Enum, not string
        });

        return savedOrder;
    }

    async findAll(userId: string, status?: string, limit = 50, offset = 0): Promise<[Order[], number]> {
        const query = this.orderRepository
            .createQueryBuilder('order')
            .where('order.userId = :userId', { userId });

        if (status) {
            query.andWhere('order.status = :status', { status });
        }

        query
            .leftJoinAndSelect('order.packages', 'packages')
            .orderBy('order.createdAt', 'DESC')
            .take(limit)
            .skip(offset);

        return query.getManyAndCount();
    }

    async findOne(id: string, userId: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['packages', 'shipments', 'payments', 'user', 'driver'],
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        if (order.user.id !== userId) {
            throw new ForbiddenException('You do not have access to this order');
        }

        return order;
    }

    async cancelOrder(id: string, userId: string): Promise<Order> {
        const order = await this.findOne(id, userId);

        if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.VALIDATED) {
            throw new BadRequestException('Order cannot be cancelled at this stage');
        }

        order.status = OrderStatus.CANCELLED;
        const updated = await this.orderRepository.save(order);

        // Send cancellation notification - USING ENUMS ✅
        await this.notificationsService.create({
            userId,
            orderId: order.id,
            type: NotificationType.ORDER_CANCELLED,    // ✅ Enum
            title: 'Order Cancelled',
            body: 'Your order has been cancelled successfully.',
            channels: [NotificationChannel.PUSH, NotificationChannel.SMS],  // ✅ Enum array
            priority: NotificationPriority.NORMAL,     // ✅ Enum
        });

        return updated;
    }

    async updateStatus(id: string, status: OrderStatus, driverId?: string): Promise<Order> {
        const order = await this.orderRepository.findOne({ where: { id }, relations: ['driver'] });

        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        order.status = status;

        if (driverId) {
            order.assignedAt = new Date();
        }

        if (status === OrderStatus.PICKUP_COMPLETED) {
            order.pickupCompletedAt = new Date();
        }

        if (status === OrderStatus.DELIVERED) {
            order.deliveredAt = new Date();
        }

        return this.orderRepository.save(order);
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private calculatePricing(
        deliveryMode: string,
        volumeCm3: number,
        weightKg: number,
        distanceKm: number,
    ): { totalAmount: number; driverEarnings: number; platformFee: number } {
        const isExpress = deliveryMode === 'express_direct';
        const baseFee = isExpress ? 3.0 : 2.0;
        const distanceFee = distanceKm * 0.5;
        const sizeSurcharge = volumeCm3 > 30000 ? 3.0 : volumeCm3 > 10000 ? 2.0 : 0;

        const totalAmount = baseFee + distanceFee + sizeSurcharge;
        const driverEarnings = totalAmount * 0.7;
        const platformFee = totalAmount - driverEarnings;

        return {
            totalAmount: Math.round(totalAmount * 100) / 100,
            driverEarnings: Math.round(driverEarnings * 100) / 100,
            platformFee: Math.round(platformFee * 100) / 100,
        };
    }

    async getTrackingInfo(orderId: string, userId: string): Promise<any> {
        const order = await this.findOne(orderId, userId);

        let driverLocation = null;
        if (order.driver) {
            driverLocation = {
                lat: order.driver.currentLat,
                lng: order.driver.currentLng,
                lastUpdated: new Date(),
            };
        }

        return {
            orderId: order.id,
            status: order.status,
            pickupAddress: order.pickupAddress,
            dropoffAddress: order.dropoffAddress,
            estimatedDeliveryTime: order.deliveryLatestTime,
            driverLocation,
            timeline: {
                orderCreated: order.createdAt,
                assignedAt: order.assignedAt,
                pickupCompletedAt: order.pickupCompletedAt,
                deliveredAt: order.deliveredAt,
            },
        };
    }
}