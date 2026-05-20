// src/modules/drivers/drivers.service.ts

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './entities/driver.entity';
import { DriverLocation } from './entities/driver-location.entity';
import { User } from '../users/entities/user.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AcceptOrderDto } from './dto/accept-order.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel, NotificationPriority } from '../notifications/entities/notification.entity';

@Injectable()
export class DriversService {
    constructor(
        @InjectRepository(Driver)
        private driverRepository: Repository<Driver>,
        @InjectRepository(DriverLocation)
        private driverLocationRepository: Repository<DriverLocation>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        private notificationsService: NotificationsService,
    ) { }

    async getDriverProfile(userId: string): Promise<Driver> {
        const driver = await this.driverRepository.findOne({
            where: { userId },
            relations: ['user'],
        });

        if (!driver) {
            throw new NotFoundException('Driver profile not found');
        }

        return driver;
    }

    async updateLocation(userId: string, updateLocationDto: UpdateLocationDto): Promise<Driver> {
        const driver = await this.getDriverProfile(userId);

        driver.currentLat = updateLocationDto.latitude;
        driver.currentLng = updateLocationDto.longitude;
        await this.driverRepository.save(driver);

        const locationHistory = this.driverLocationRepository.create({
            driverId: driver.id,
            latitude: updateLocationDto.latitude,
            longitude: updateLocationDto.longitude,
            accuracy: updateLocationDto.accuracy || null,
        });
        await this.driverLocationRepository.save(locationHistory);

        return driver;
    }

    async updateStatus(userId: string, updateStatusDto: UpdateStatusDto): Promise<Driver> {
        const driver = await this.getDriverProfile(userId);
        driver.status = updateStatusDto.status;
        await this.driverRepository.save(driver);
        return driver;
    }

    async getNearbyOrders(userId: string): Promise<Order[]> {
        const driver = await this.getDriverProfile(userId);

        if (!driver.currentLat || !driver.currentLng) {
            throw new BadRequestException('Driver location not set. Please update location first.');
        }

        if (driver.status !== DriverStatus.ONLINE) {
            throw new BadRequestException('Driver must be online to see orders');
        }

        const allPendingOrders = await this.orderRepository.find({
            where: { status: OrderStatus.PENDING },
            relations: ['packages'],
        });

        const radiusKm = 5;
        const nearbyOrders = allPendingOrders
            .map(order => ({
                order,
                distance: this.calculateDistance(
                    driver.currentLat!,
                    driver.currentLng!,
                    order.pickupLatitude,
                    order.pickupLongitude,
                ),
            }))
            .filter(item => item.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 20)
            .map(item => item.order);

        return nearbyOrders;
    }

    // get all accepted orders
    async getAssignedOrders(userId: string): Promise<Order[]> {
        const driver = await this.getDriverProfile(userId);

        if (driver.status !== DriverStatus.ONLINE) {
            throw new BadRequestException('Driver must be online to see orders');
        }

        const allAssignedOrders = await this.orderRepository.find({
            where: { status: OrderStatus.ASSIGNED },
            relations: ['packages'],
        });

        return allAssignedOrders;
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

    async acceptOrder(userId: string, acceptOrderDto: AcceptOrderDto): Promise<Order> {
        const driver = await this.getDriverProfile(userId);

        if (driver.status !== DriverStatus.ONLINE) {
            throw new BadRequestException('Driver must be online to accept orders');
        }

        const order = await this.orderRepository.findOne({
            where: { id: acceptOrderDto.orderId },
            relations: ['user', 'packages'],
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.VALIDATED) {
            throw new BadRequestException('Order is no longer available');
        }

        order.driverId = driver.id;
        order.status = OrderStatus.ASSIGNED;
        order.assignedAt = new Date();
        await this.orderRepository.save(order);

        // ✅ FIX: Convert to numbers explicitly
        let totalWeight = 0;
        if (order.packages && order.packages.length > 0) {
            for (const pkg of order.packages) {
                totalWeight += Number(pkg.weightKg) || 0;  // ✅ Ensure number
            }
        }

        // ✅ Ensure currentWeightKg is a number
        const currentWeight = Number(driver.currentWeightKg) || 0;
        driver.currentWeightKg = currentWeight + totalWeight;  // ✅ Numeric addition
        await this.driverRepository.save(driver);

        await this.notificationsService.create({
            userId: order.user.id,
            orderId: order.id,
            type: NotificationType.DRIVER_ASSIGNED,
            title: 'Driver Assigned',
            body: `A driver has been assigned to your order.`,
            channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
            priority: NotificationPriority.NORMAL,
        });

        return order;
    }

    async updateOrderStatus(
        userId: string,
        orderId: string,
        status: string,
        proofPhoto?: string,
    ): Promise<Order> {
        const driver = await this.getDriverProfile(userId);

        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user'],
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.driverId !== driver.id) {
            throw new ForbiddenException('This order is not assigned to you');
        }

        let newStatus: OrderStatus;
        switch (status) {
            case 'picked_up':
                newStatus = OrderStatus.PICKUP_COMPLETED;
                order.pickupCompletedAt = new Date();
                break;
            case 'delivered':
                newStatus = OrderStatus.DELIVERED;
                order.deliveredAt = new Date();
                if (proofPhoto) {
                    console.log(`Delivery proof for order ${orderId}: ${proofPhoto}`);
                }
                break;
            case 'failed':
                newStatus = OrderStatus.FAILED;
                break;
            default:
                throw new BadRequestException('Invalid status');
        }

        order.status = newStatus;
        await this.orderRepository.save(order);

        let notificationTitle = '';
        let notificationBody = '';
        let notificationType = NotificationType.DELIVERY_COMPLETED;

        if (status === 'picked_up') {
            notificationTitle = 'Package Picked Up';
            notificationBody = 'Your package has been picked up and is on its way.';
            notificationType = NotificationType.PACKAGE_COLLECTED;
        } else if (status === 'delivered') {
            notificationTitle = 'Package Delivered';
            notificationBody = 'Your package has been successfully delivered.';
            notificationType = NotificationType.DELIVERY_COMPLETED;
        } else if (status === 'failed') {
            notificationTitle = 'Delivery Failed';
            notificationBody = 'We could not complete your delivery. Our team will contact you.';
            notificationType = NotificationType.DELIVERY_FAILED;
        }

        await this.notificationsService.create({
            userId: order.user.id,
            orderId: order.id,
            type: notificationType,
            title: notificationTitle,
            body: notificationBody,
            channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
            priority: NotificationPriority.HIGH,
        });

        return order;
    }

    async getEarnings(userId: string): Promise<any> {
        const driver = await this.getDriverProfile(userId);

        const completedOrders = await this.orderRepository.find({
            where: { driverId: driver.id, status: OrderStatus.DELIVERED },
        });

        const totalEarnings = completedOrders.reduce((sum, order) => sum + order.driverEarnings, 0);
        const pendingOrders = await this.orderRepository.find({
            where: { driverId: driver.id, status: OrderStatus.ASSIGNED },
        });

        return {
            totalEarnings,
            completedDeliveries: completedOrders.length,
            pendingDeliveries: pendingOrders.length,
            rating: driver.rating,
        };
    }
}