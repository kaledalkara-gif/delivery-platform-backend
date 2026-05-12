import {
    IsUUID,
    IsEnum,
    IsString,
    IsOptional,
    IsArray,
    IsObject,
    MaxLength,
} from 'class-validator';
import {
    NotificationType,
    NotificationChannel,
    NotificationPriority,
} from '../entities/notification.entity';

export class CreateNotificationDto {
    @IsUUID()
    userId!: string;

    @IsUUID()
    @IsOptional()
    orderId?: string;

    @IsEnum(NotificationType)
    type!: NotificationType;

    @IsString()
    @MaxLength(255)
    title!: string;

    @IsString()
    body!: string;

    @IsString()
    @IsOptional()
    deepLinkUrl?: string;

    @IsObject()
    @IsOptional()
    data?: Record<string, any>;

    @IsArray()
    @IsEnum(NotificationChannel, { each: true })
    channels!: NotificationChannel[];

    @IsEnum(NotificationPriority)
    @IsOptional()
    priority?: NotificationPriority;
}