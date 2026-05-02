import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

export enum NotificationType {
  // Order Status Notifications
  ORDER_CREATED = 'order_created',
  ORDER_ASSIGNED = 'order_assigned',
  ORDER_CANCELLED = 'order_cancelled',
  
  // Pickup Notifications
  PICKUP_REMINDER = 'pickup_reminder',
  DRIVER_EN_ROUTE_TO_PICKUP = 'driver_en_route_pickup',
  DRIVER_ARRIVED_PICKUP = 'driver_arrived_pickup',
  PACKAGE_COLLECTED = 'package_collected',
  PICKUP_FAILED = 'pickup_failed',
  
  // Depot Notifications (for standard deliveries)
  PACKAGE_AT_DEPOT = 'package_at_depot',
  PACKAGE_DISPATCHED_FROM_DEPOT = 'package_dispatched_from_depot',
  
  // Delivery Notifications
  DRIVER_EN_ROUTE_TO_DROPOFF = 'driver_en_route_dropoff',
  DRIVER_ARRIVED_DROPOFF = 'driver_arrived_dropoff',
  DELIVERY_COMPLETED = 'delivery_completed',
  DELIVERY_FAILED = 'delivery_failed',
  DELIVERY_RESCHEDULED = 'delivery_rescheduled',
  
  // Driver Related
  DRIVER_ASSIGNED = 'driver_assigned',
  DRIVER_REASSIGNED = 'driver_reassigned',
  
  // System Notifications
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_PROCESSED = 'refund_processed',
  
  // Promotional
  PROMOTION_OFFER = 'promotion_offer',
  REFERRAL_BONUS = 'referral_bonus',
}

export enum NotificationChannel {
  PUSH = 'push',      // Mobile push notification
  SMS = 'sms',        // Text message
  EMAIL = 'email',    // Email (future)
  IN_APP = 'in_app',  // Inside the app only
}

export enum NotificationPriority {
  LOW = 'low',       // Marketing, tips
  NORMAL = 'normal', // Standard updates
  HIGH = 'high',     // Time-sensitive (driver arriving)
  URGENT = 'urgent', // Failed delivery, payment issues
}

export enum NotificationStatus {
  PENDING = 'pending',     // Queued to be sent
  SENT = 'sent',           // Successfully sent
  DELIVERED = 'delivered', // Confirmed delivered to device
  READ = 'read',           // User opened/read it
  FAILED = 'failed',       // Failed to send
}

@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['orderId'])
@Index(['status', 'createdAt'])
export class Notification extends BaseEntity {
  // Relations
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

  // Core notification fields
  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  // Optional: For deep linking into the app
  @Column({ type: 'text', nullable: true })
  deepLinkUrl!: string | null;

  // Optional: Additional data payload (JSON)
  @Column({ type: 'jsonb', nullable: true })
  data!: Record<string, any> | null;

  // Delivery configuration
  @Column({ type: 'enum', enum: NotificationChannel, array: true, default: [NotificationChannel.PUSH] })
  channels!: NotificationChannel[];

  @Column({ type: 'enum', enum: NotificationPriority, default: NotificationPriority.NORMAL })
  priority!: NotificationPriority;

  // Status tracking
  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status!: NotificationStatus;

  // Timestamps for delivery
  @Column({ type: 'timestamp', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  readAt!: Date | null;

  // For SMS-specific tracking
  @Column({ type: 'varchar', length: 255, nullable: true })
  smsMessageId!: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  // Retry logic
  @Column({ type: 'integer', default: 0 })
  retryCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt!: Date | null;
}