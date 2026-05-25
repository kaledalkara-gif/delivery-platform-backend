// src/modules/admin/admin.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { Driver, VehicleType, DriverStatus } from '../drivers/entities/driver.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Driver)
        private driverRepository: Repository<Driver>,
    ) { }

    // Get all users
    @Get('users')
    async getAllUsers() {
        return this.userRepository.find({
            select: ['id', 'email', 'name', 'phone', 'role', 'isActive', 'createdAt'],
            order: { createdAt: 'DESC' },
        });
    }

    // Get user by ID
    @Get('users/:id')
    async getUserById(@Param('id') id: string) {
        return this.userRepository.findOne({
            where: { id },
            select: ['id', 'email', 'name', 'phone', 'role', 'isActive', 'createdAt'],
        });
    }

    // Change user role
    @Patch('users/:id/role')
    async changeUserRole(
        @Param('id') id: string,
        @Body('role') role: UserRole,
        @CurrentUser() currentUser: { id: string },
    ) {
        // Prevent admin from changing their own role
        if (id === currentUser.id) {
            throw new Error('You cannot change your own role');
        }

        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error('User not found');
        }

        const oldRole = user.role;
        user.role = role;
        await this.userRepository.save(user);

        // If changing to driver, create driver profile
        if (role === UserRole.DRIVER && oldRole !== UserRole.DRIVER) {
            const existingDriver = await this.driverRepository.findOne({
                where: { userId: user.id },
            });

            if (!existingDriver) {
                const driver = this.driverRepository.create({
                    userId: user.id,
                    vehicleType: VehicleType.SMALL_CAR,
                    status: DriverStatus.OFFLINE,
                    maxWeightKg: 50,
                    maxVolumeCm3: 50000,
                    rating: 0,
                    totalDeliveries: 0,
                });
                await this.driverRepository.save(driver);
            }
        }

        return { message: `User role changed from ${oldRole} to ${role}` };
    }

    // Reset user password
    @Post('users/:id/reset-password')
    async resetPassword(@Param('id') id: string) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error('User not found');
        }

        const defaultPassword = '123456';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        user.passwordHash = hashedPassword;
        await this.userRepository.save(user);

        return {
            message: `Password reset to default: ${defaultPassword}`,
            email: user.email,
        };
    }

    // Activate/Deactivate user account
    @Patch('users/:id/toggle-status')
    async toggleUserStatus(@Param('id') id: string) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error('User not found');
        }

        user.isActive = !user.isActive;
        await this.userRepository.save(user);

        return {
            message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
            isActive: user.isActive,
        };
    }

    // Get all drivers (with details)
    @Get('drivers')
    async getAllDrivers() {
        return this.driverRepository.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    // Get statistics
    @Get('stats')
    async getAdminStats() {
        const [totalUsers, totalCustomers, totalDrivers, totalDispatchers] = await Promise.all([
            this.userRepository.count(),
            this.userRepository.count({ where: { role: UserRole.CUSTOMER } }),
            this.userRepository.count({ where: { role: UserRole.DRIVER } }),
            this.userRepository.count({ where: { role: UserRole.DISPATCHER } }),
        ]);

        const activeDrivers = await this.driverRepository.count({
            where: { status: DriverStatus.ONLINE }
        });

        return {
            totalUsers,
            totalCustomers,
            totalDrivers,
            totalDispatchers,
            activeDrivers,
        };
    }
}