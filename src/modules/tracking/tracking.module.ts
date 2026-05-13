import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TrackingGateway } from './tracking.gateway';
import { Driver } from '../drivers/entities/driver.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Driver, Order]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: { expiresIn: '7d' },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [TrackingGateway],
    exports: [TrackingGateway],
})
export class TrackingModule { }