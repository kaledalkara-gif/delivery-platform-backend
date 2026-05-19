import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { Driver, VehicleType, DriverStatus } from '../drivers/entities/driver.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { DriverRegisterDto } from './dto/driver-register.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Driver)
        private driverRepository: Repository<Driver>,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; token: string }> {


        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
            where: { email: registerDto.email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        // Create user
        const user = this.userRepository.create({
            email: registerDto.email,
            passwordHash: hashedPassword,
            name: registerDto.name,
            phone: registerDto.phone,
            address: registerDto.address,
            role: registerDto.role || UserRole.CUSTOMER,
            isActive: true,
        });

        await this.userRepository.save(user);

        // Generate JWT token
        const token = this.generateToken(user);

        // Return user without password
        const { passwordHash, ...userWithoutPassword } = user;

        return { user: userWithoutPassword, token };
    }

    async login(loginDto: LoginDto): Promise<{ user: Partial<User>; token: string }> {
        // Find user by email
        const user = await this.userRepository.findOne({
            where: { email: loginDto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Generate token
        const token = this.generateToken(user);

        // Return user without password
        const { passwordHash, ...userWithoutPassword } = user;

        return { user: userWithoutPassword, token };
    }

    async registerAsDriver(driverRegisterDto: DriverRegisterDto): Promise<Driver> {
        // Check if user exists
        const user = await this.userRepository.findOne({
            where: { id: driverRegisterDto.userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Check if user is already a driver
        const existingDriver = await this.driverRepository.findOne({
            where: { userId: driverRegisterDto.userId },
        });

        if (existingDriver) {
            throw new ConflictException('User is already registered as a driver');
        }

        // Create driver profile
        const driver = this.driverRepository.create({
            userId: driverRegisterDto.userId,
            vehicleType: driverRegisterDto.vehicleType,
            vehiclePlate: driverRegisterDto.vehiclePlate,
            maxWeightKg: driverRegisterDto.maxWeightKg || 50,
            maxVolumeCm3: driverRegisterDto.maxVolumeCm3 || 50000,
            status: DriverStatus.OFFLINE,
            rating: 0,
            totalDeliveries: 0,
            currentWeightKg: 0,
            currentVolumeCm3: 0,
        });

        await this.driverRepository.save(driver);

        // Update user role to driver
        user.role = UserRole.DRIVER;
        await this.userRepository.save(user);

        return driver;
    }

    async getProfile(userId: string): Promise<Partial<User>> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    private generateToken(user: User): string {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return this.jwtService.sign(payload);
    }

}