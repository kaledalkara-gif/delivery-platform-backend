import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('create-intent/:orderId')
    async createPaymentIntent(
        @CurrentUser('id') userId: string,
        @Param('orderId') orderId: string,
    ) {
        return this.paymentsService.createPaymentIntent(orderId);
    }

    @Get('status/:orderId')
    async getPaymentStatus(
        @CurrentUser('id') userId: string,
        @Param('orderId') orderId: string,
    ) {
        return this.paymentsService.getPaymentStatus(orderId);
    }
}