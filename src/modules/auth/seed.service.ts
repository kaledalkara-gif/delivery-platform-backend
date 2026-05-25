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

        // Check if admin already exists
        const existingAdmin = await this.userRepository.findOne({
            where: { email: adminEmail },
        });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            const admin = this.userRepository.create({
                email: adminEmail,
                passwordHash: hashedPassword,
                name: 'System Administrator',
                role: UserRole.ADMIN,
                isActive: true,
            });

            await this.userRepository.save(admin);
            this.logger.log('✅ Default admin account created: admin@example.com / 123456');
        } else {
            this.logger.log('ℹ️ Admin account already exists');
        }
    }
}