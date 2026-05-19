import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Driver, DriverStatus } from '../drivers/entities/driver.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('dispatcher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('dispatcher', 'admin')
export class DispatcherController {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(Driver)
        private driverRepository: Repository<Driver>,
    ) { }

    @Get('stats')
    async getStats() {
        // ✅ Use enums instead of strings
        const [totalOrders, pendingOrders, completedDeliveries] = await Promise.all([
            this.orderRepository.count(),
            this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
            this.orderRepository.count({ where: { status: OrderStatus.DELIVERED } }),
        ]);

        // ✅ Use enum for driver status
        const activeDrivers = await this.driverRepository.count({
            where: { status: DriverStatus.ONLINE }
        });

        const revenueResult = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.totalAmount)', 'total')
            .where('order.status = :status', { status: OrderStatus.DELIVERED })
            .getRawOne();

        return {
            totalOrders,
            pendingOrders,
            activeDrivers,
            completedDeliveries,
            totalRevenue: revenueResult?.total || 0,
        };
    }

    @Get('drivers')
    async getDrivers() {
        return this.driverRepository.find({ relations: ['user'] });
    }

    @Get('orders')
    async getOrders(@Body('status') status?: string) {
        const where: any = {};
        if (status && status !== 'all') {
            // Convert string to enum
            where.status = status as OrderStatus;
        }
        return this.orderRepository.find({
            where,
            relations: ['driver', 'driver.user', 'packages'],
            order: { createdAt: 'DESC' },
        });
    }

    @Patch('orders/:orderId/assign')
    async assignDriver(
        @Param('orderId') orderId: string,
        @Body('driverId') driverId: string
    ) {
        const order = await this.orderRepository.findOne({ where: { id: orderId } });
        if (!order) throw new Error('Order not found');

        order.driverId = driverId;
        order.status = OrderStatus.ASSIGNED;  // ✅ Use enum
        order.assignedAt = new Date();

        return this.orderRepository.save(order);
    }
}