// src/modules/orders/orders.controller.ts

import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        @InjectRepository(User)  // ← Inject User repository
        private userRepository: Repository<User>,
    ) { }

    @Post()
    async createOrder(
        @CurrentUser() currentUser: { id: string; email: string; name: string },
        @Body() createOrderDto: CreateOrderDto,
    ) {
        // Fetch the complete User entity from database
        const user = await this.userRepository.findOne({
            where: { id: currentUser.id }
        });

        if (!user) {
            throw new Error('User not found');
        }

        const order = await this.ordersService.createOrder(user, createOrderDto);
        return {
            success: true,
            message: 'Order created successfully',
            data: order,
        };
    }

    @Get()
    async getUserOrders(
        @CurrentUser('id') userId: string,
        @Query('status') status?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const [orders, total] = await this.ordersService.findAll(
            userId,
            status,
            limit ? parseInt(limit, 10) : 50,
            offset ? parseInt(offset, 10) : 0,
        );
        return {
            success: true,
            data: orders,
            meta: {
                total,
                limit: limit ? parseInt(limit, 10) : 50,
                offset: offset ? parseInt(offset, 10) : 0,
            },
        };
    }

    @Get(':id')
    async getOrder(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        const order = await this.ordersService.findOne(id, userId);
        return {
            success: true,
            data: order,
        };
    }

    @Patch(':id/cancel')
    async cancelOrder(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        const order = await this.ordersService.cancelOrder(id, userId);
        return {
            success: true,
            message: 'Order cancelled successfully',
            data: order,
        };
    }

    @Get(':id/track')
    async trackOrder(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        const trackingInfo = await this.ordersService.getTrackingInfo(id, userId);
        return {
            success: true,
            data: trackingInfo,
        };
    }
}