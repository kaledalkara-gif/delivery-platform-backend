import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatcherController } from './dispatcher.controller';
import { Order } from '../orders/entities/order.entity';
import { Driver } from '../drivers/entities/driver.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, Driver])],
    controllers: [DispatcherController],
    providers: [],
})
export class DispatcherModule { }