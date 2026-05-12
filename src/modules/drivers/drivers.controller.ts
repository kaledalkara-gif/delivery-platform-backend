import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AcceptOrderDto } from './dto/accept-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('drivers')
@UseGuards(JwtAuthGuard)
export class DriversController {
    constructor(private readonly driversService: DriversService) { }

    @Get('profile')
    async getDriverProfile(@CurrentUser('id') userId: string) {
        return this.driversService.getDriverProfile(userId);
    }

    @Patch('location')
    async updateLocation(
        @CurrentUser('id') userId: string,
        @Body() updateLocationDto: UpdateLocationDto,
    ) {
        return this.driversService.updateLocation(userId, updateLocationDto);
    }

    @Patch('status')
    async updateStatus(
        @CurrentUser('id') userId: string,
        @Body() updateStatusDto: UpdateStatusDto,
    ) {
        return this.driversService.updateStatus(userId, updateStatusDto);
    }

    @Get('nearby-orders')
    async getNearbyOrders(@CurrentUser('id') userId: string) {
        return this.driversService.getNearbyOrders(userId);
    }

    @Post('accept-order')
    async acceptOrder(
        @CurrentUser('id') userId: string,
        @Body() acceptOrderDto: AcceptOrderDto,
    ) {
        return this.driversService.acceptOrder(userId, acceptOrderDto);
    }

    @Patch('orders/:orderId/status')
    async updateOrderStatus(
        @CurrentUser('id') userId: string,
        @Param('orderId') orderId: string,
        @Body('status') status: string,
        @Body('proofPhoto') proofPhoto?: string,
    ) {
        return this.driversService.updateOrderStatus(userId, orderId, status, proofPhoto);
    }

    @Get('earnings')
    async getEarnings(@CurrentUser('id') userId: string) {
        return this.driversService.getEarnings(userId);
    }
}
