import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { NotificationType, NotificationChannel, NotificationPriority } from './notification.entity';

@Entity('notification_templates')
export class NotificationTemplate extends BaseEntity {
  @Column({ type: 'enum', enum: NotificationType, unique: true })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  defaultTitle!: string;

  @Column({ type: 'text' })
  defaultBody!: string;

  @Column({ type: 'enum', enum: NotificationChannel, array: true })
  defaultChannels!: NotificationChannel[];

  @Column({ type: 'enum', enum: NotificationPriority, default: NotificationPriority.NORMAL })
  defaultPriority!: NotificationPriority;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  description!: string | null;
}