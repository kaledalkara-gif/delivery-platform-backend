// src/modules/payments/payments.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { WebhookController } from './webhook.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity'; // ✅ Add this
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment, Order, User]), // ✅ Add User here
        NotificationsModule,
    ],
    controllers: [PaymentsController, WebhookController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule { }