import { Controller, Post, Body, Get, UseGuards, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { DriverRegisterDto } from './dto/driver-register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        @InjectRepository(User)  // ✅ Add this
        private userRepository: Repository<User>,  // ✅ Add this
    ) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('driver/register')
    @UseGuards(JwtAuthGuard)
    async registerAsDriver(@Body() driverRegisterDto: DriverRegisterDto) {
        return this.authService.registerAsDriver(driverRegisterDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@CurrentUser() user: { id: string }) {
        return this.authService.getProfile(user.id);
    }

    // ✅ NEW: Register Dispatcher (Admin only)
    @Post('register-dispatcher')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async registerDispatcher(@Body() registerDto: RegisterDto) {
        // First register the user
        const result = await this.authService.register(registerDto);

        // Update role to dispatcher
        await this.userRepository.update(result.user.id, { role: UserRole.DISPATCHER });

        return {
            message: 'Dispatcher created successfully',
            user: result.user,
        };
    }
}