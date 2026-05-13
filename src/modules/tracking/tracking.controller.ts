import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
    constructor(private readonly trackingGateway: TrackingGateway) { }

    @Get('order/:orderId')
    async getOrderTracking(
        @CurrentUser('id') userId: string,
        @Param('orderId') orderId: string,
    ) {
        // This would also verify the user owns the order
        const location = await this.trackingGateway.getCurrentDriverLocation(orderId);
        return {
            success: true,
            data: location,
        };
    }
}