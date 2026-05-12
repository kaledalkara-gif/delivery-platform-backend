import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationChannel, NotificationPriority, NotificationStatus } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) { }

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: createDto.userId,
      orderId: createDto.orderId,
      type: createDto.type,
      title: createDto.title,
      body: createDto.body,
      deepLinkUrl: createDto.deepLinkUrl,
      data: createDto.data,
      channels: createDto.channels,
      priority: createDto.priority,
      status: NotificationStatus.PENDING,
    });

    const saved = await this.notificationRepository.save(notification);

    // Trigger sending (async)
    this.send(saved).catch(err => {
      this.logger.error(`Failed to send notification ${saved.id}: ${err.message}`);
    });

    return saved;
  }

  async send(notification: Notification): Promise<void> {
    // Implementation will depend on your push notification service (FCM for push, Twilio for SMS)
    // This is a placeholder
    this.logger.log(`Sending notification ${notification.id} to user ${notification.userId}`);

    // Update status
    notification.status = NotificationStatus.SENT;
    notification.sentAt = new Date();
    await this.notificationRepository.save(notification);
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { status: NotificationStatus.READ, readAt: new Date() }
    );
  }

  async getUserNotifications(userId: string, limit = 50, offset = 0): Promise<[Notification[], number]> {
    return this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, status: NotificationStatus.SENT },
    });
  }

  // Helper methods for common notifications
  async notifyDriverAssigned(orderId: string, userId: string, driverName: string): Promise<Notification> {
    return this.create({
      userId,
      orderId,
      type: NotificationType.DRIVER_ASSIGNED,
      title: 'Driver Assigned',
      body: `${driverName} has been assigned to deliver your package.`,
      channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
      priority: NotificationPriority.NORMAL,
    });
  }

  async notifyPackageCollected(orderId: string, userId: string): Promise<Notification> {
    return this.create({
      userId,
      orderId,
      type: NotificationType.PACKAGE_COLLECTED,
      title: 'Package Collected',
      body: 'Your package has been picked up and is on its way.',
      channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
      priority: NotificationPriority.NORMAL,
    });
  }

  async notifyDriverArriving(orderId: string, userId: string, etaMinutes: number): Promise<Notification> {
    return this.create({
      userId,
      orderId,
      type: NotificationType.DRIVER_ARRIVED_DROPOFF,
      title: 'Driver Arriving',
      body: `Your driver will arrive in approximately ${etaMinutes} minutes.`,
      channels: [NotificationChannel.PUSH],
      priority: NotificationPriority.HIGH,
    });
  }

  async notifyDeliveryCompleted(orderId: string, userId: string): Promise<Notification> {
    return this.create({
      userId,
      orderId,
      type: NotificationType.DELIVERY_COMPLETED,
      title: 'Package Delivered',
      body: 'Your package has been successfully delivered.',
      channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
      priority: NotificationPriority.NORMAL,
    });
  }

  async notifyDeliveryFailed(orderId: string, userId: string, reason: string): Promise<Notification> {
    return this.create({
      userId,
      orderId,
      type: NotificationType.DELIVERY_FAILED,
      title: 'Delivery Failed',
      body: `We could not complete your delivery: ${reason}. Our team will contact you shortly.`,
      channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
      priority: NotificationPriority.URGENT,
    });
  }
}