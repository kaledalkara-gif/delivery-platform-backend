import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../drivers/entities/driver.entity';
import { Order } from '../orders/entities/order.entity';

@WebSocketGateway({
    namespace: 'tracking',
    cors: {
        origin: '*', // Configure properly for production
        credentials: true,
    },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(TrackingGateway.name);
    private driverSockets: Map<string, string> = new Map(); // driverId -> socketId
    private orderRooms: Map<string, string[]> = new Map(); // orderId -> [socketIds]

    @WebSocketServer()
    server: Server;

    constructor(
        private jwtService: JwtService,
        @InjectRepository(Driver)
        private driverRepository: Repository<Driver>,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
    ) { }

    async handleConnection(client: Socket) {
        try {
            // Extract token from handshake auth
            const token = client.handshake.auth.token;
            if (!token) {
                throw new UnauthorizedException('No token provided');
            }

            // Verify JWT token
            const payload = this.jwtService.verify(token);
            const userId = payload.sub;

            // Find driver by user ID
            const driver = await this.driverRepository.findOne({
                where: { userId },
            });

            if (!driver) {
                throw new UnauthorizedException('Not a driver account');
            }

            // Store connection
            this.driverSockets.set(driver.id, client.id);
            client.data.driverId = driver.id;
            client.data.userId = userId;

            this.logger.log(`Driver ${driver.id} connected with socket ${client.id}`);

            // Join driver to their personal room
            client.join(`driver:${driver.id}`);

        } catch (error) {
            // ✅ Safe error handling for unknown type
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Connection error: ${errorMessage}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const driverId = client.data.driverId;
        if (driverId) {
            this.driverSockets.delete(driverId);
            this.logger.log(`Driver ${driverId} disconnected`);
        }
    }

    @SubscribeMessage('order:join')
    async handleJoinOrder(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { orderId: string },
    ) {
        const driverId = client.data.driverId;
        if (!driverId) {
            throw new UnauthorizedException('Not authenticated');
        }

        const { orderId } = data;

        // Verify order belongs to this driver
        const order = await this.orderRepository.findOne({
            where: { id: orderId, driverId },
        });

        if (!order) {
            this.logger.warn(`Driver ${driverId} attempted to join order ${orderId} - not authorized`);
            return { success: false, message: 'Order not found or not assigned to you' };
        }

        // Join the order room
        client.join(`order:${orderId}`);

        if (!this.orderRooms.has(orderId)) {
            this.orderRooms.set(orderId, []);
        }
        this.orderRooms.get(orderId)!.push(client.id);

        this.logger.log(`Driver ${driverId} joined order room ${orderId}`);

        return { success: true, message: `Joined order ${orderId}` };
    }

    @SubscribeMessage('order:leave')
    async handleLeaveOrder(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { orderId: string },
    ) {
        const { orderId } = data;
        client.leave(`order:${orderId}`);

        const sockets = this.orderRooms.get(orderId);
        if (sockets) {
            const index = sockets.indexOf(client.id);
            if (index !== -1) {
                sockets.splice(index, 1);
            }
            if (sockets.length === 0) {
                this.orderRooms.delete(orderId);
            }
        }

        this.logger.log(`Client left order room ${orderId}`);
        return { success: true };
    }

    @SubscribeMessage('location:update')
    async handleLocationUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: {
            orderId: string;
            latitude: number;
            longitude: number;
            accuracy?: number;
            heading?: number;
            speed?: number;
        },
    ) {
        const driverId = client.data.driverId;
        if (!driverId) {
            throw new UnauthorizedException('Not authenticated');
        }

        const { orderId, latitude, longitude, accuracy, heading, speed } = data;

        // Verify order belongs to this driver
        const order = await this.orderRepository.findOne({
            where: { id: orderId, driverId },
        });

        if (!order) {
            return { success: false, message: 'Not authorized for this order' };
        }

        // Update driver's current location in database
        await this.driverRepository.update(driverId, {
            currentLat: latitude,
            currentLng: longitude,
        });

        // Create location update payload
        const locationUpdate = {
            orderId,
            driverId,
            latitude,
            longitude,
            accuracy: accuracy || null,
            heading: heading || null,
            speed: speed || null,
            timestamp: new Date().toISOString(),
        };

        // Broadcast to all clients in the order room (customer app)
        this.server.to(`order:${orderId}`).emit('location:received', locationUpdate);

        this.logger.debug(`Location update for order ${orderId}: ${latitude}, ${longitude}`);

        return { success: true };
    }

    // Method for customers to subscribe to order tracking
    async subscribeCustomerToOrder(orderId: string, customerSocketId: string): Promise<void> {
        const socket = this.server.sockets.sockets.get(customerSocketId);
        if (socket) {
            socket.join(`order:${orderId}`);
            this.logger.log(`Customer socket ${customerSocketId} subscribed to order ${orderId}`);
        }
    }

    // Get current driver location for an order
    async getCurrentDriverLocation(orderId: string): Promise<any> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['driver'],
        });

        if (!order || !order.driver) {
            return null;
        }

        return {
            driverId: order.driver.id,
            latitude: order.driver.currentLat,
            longitude: order.driver.currentLng,
            lastUpdated: order.driver.updatedAt,
        };
    }
}