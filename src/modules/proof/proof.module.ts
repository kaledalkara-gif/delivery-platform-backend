import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProofController } from './proof.controller';
import { ProofService } from './proof.service';
import { Proof } from './entities/proof.entity';
import { Order } from '../orders/entities/order.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Proof, Order]),
        NotificationsModule,
    ],
    controllers: [ProofController],
    providers: [ProofService],
    exports: [ProofService],
})
export class ProofModule { }