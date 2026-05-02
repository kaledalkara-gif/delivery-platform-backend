// src/modules/notifications/entities/notification.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_ASSIGNED = 'order_assigned',
  ORDER_CANCELLED = 'order_cancelled',
  PICKUP_REMINDER = 'pickup_reminder',
  DRIVER_EN_ROUTE_TO_PICKUP = 'driver_en_route_pickup',
  DRIVER_ARRIVED_PICKUP = 'driver_arrived_pickup',
  PACKAGE_COLLECTED = 'package_collected',
  PICKUP_FAILED = 'pickup_failed',
  PACKAGE_AT_DEPOT = 'package_at_depot',
  PACKAGE_DISPATCHED_FROM_DEPOT = 'package_dispatched_from_depot',
  DRIVER_EN_ROUTE_TO_DROPOFF = 'driver_en_route_dropoff',
  DRIVER_ARRIVED_DROPOFF = 'driver_arrived_dropoff',
  DELIVERY_COMPLETED = 'delivery_completed',
  DELIVERY_FAILED = 'delivery_failed',
  DELIVERY_RESCHEDULED = 'delivery_rescheduled',
  DRIVER_ASSIGNED = 'driver_assigned',
  DRIVER_REASSIGNED = 'driver_reassigned',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_PROCESSED = 'refund_processed',
  PROMOTION_OFFER = 'promotion_offer',
  REFERRAL_BONUS = 'referral_bonus',
}

export enum NotificationChannel {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['orderId'])
@Index(['status', 'createdAt'])
export class Notification extends BaseEntity {
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order!: Order | null;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId!: string | null;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'text', nullable: true })
  deepLinkUrl!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  data!: Record<string, any> | null;

  @Column({ type: 'enum', enum: NotificationChannel, array: true, default: [NotificationChannel.PUSH] })
  channels!: NotificationChannel[];

  @Column({ type: 'enum', enum: NotificationPriority, default: NotificationPriority.NORMAL })
  priority!: NotificationPriority;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status!: NotificationStatus;

  @Column({ type: 'timestamp', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  readAt!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  smsMessageId!: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'integer', default: 0 })
  retryCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt!: Date | null;
}