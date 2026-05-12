import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post()
    async create(@Body() createDto: CreateNotificationDto) {
        return this.notificationsService.create(createDto);
    }

    @Get()
    async getUserNotifications(
        @CurrentUser('id') userId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.notificationsService.getUserNotifications(
            userId,
            limit ? parseInt(limit, 10) : 50,
            offset ? parseInt(offset, 10) : 0,
        );
    }

    @Get('unread/count')
    async getUnreadCount(@CurrentUser('id') userId: string) {
        const count = await this.notificationsService.getUnreadCount(userId);
        return { unreadCount: count };
    }

    @Patch(':id/read')
    async markAsRead(
        @Param('id') notificationId: string,
        @CurrentUser('id') userId: string,
    ) {
        await this.notificationsService.markAsRead(notificationId, userId);
        return { success: true };
    }

    @Post('test/delivery-completed')
    async testDeliveryCompleted(@CurrentUser('id') userId: string) {
        // This is a test method for development
        return this.notificationsService.notifyDeliveryCompleted(
            'test-order-id',
            userId,
        );
    }
}