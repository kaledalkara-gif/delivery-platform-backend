// src/modules/auth/seed.service.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async onApplicationBootstrap() {
        await this.createDefaultAdmin();
    }

    private async createDefaultAdmin() {
        const adminEmail = 'admin@example.com';
        const adminPassword = '123456';

        let admin = await this.userRepository.findOne({
            where: { email: adminEmail },
        });

        if (!admin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            admin = this.userRepository.create({
                email: adminEmail,
                passwordHash: hashedPassword,
                name: 'System Administrator',
                role: UserRole.ADMIN,
                isActive: true,  // ✅ Always active
            });

            await this.userRepository.save(admin);
            this.logger.log('✅ Default admin account created: admin@example.com / 123456');
        } else {
            // ✅ Ensure admin is always active (in case someone accidentally deactivated)
            if (!admin.isActive) {
                admin.isActive = true;
                await this.userRepository.save(admin);
                this.logger.log('✅ Reactivated master admin account');
            }

            // ✅ Ensure admin role is never changed
            if (admin.role !== UserRole.ADMIN) {
                admin.role = UserRole.ADMIN;
                await this.userRepository.save(admin);
                this.logger.log('✅ Restored master admin role');
            }

            this.logger.log('ℹ️ Master admin account is protected and active');
        }
    }
}