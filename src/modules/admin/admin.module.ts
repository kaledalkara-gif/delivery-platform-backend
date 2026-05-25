import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../users/entities/user.entity';
import { Driver } from '../drivers/entities/driver.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Driver])],
    controllers: [AdminController],
    providers: [],
})
export class AdminModule { }