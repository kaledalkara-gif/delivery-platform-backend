// src/modules/users/entities/user.entity.ts
import { Entity, Column, Unique, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from '../../orders/entities/order.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Notification } from '../../notifications/entities/notification.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  DRIVER = 'driver',
  DISPATCHER = 'dispatcher',
  ADMIN = 'admin',
}

@Entity('users')
@Unique(['email'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role!: UserRole;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  defaultPickupLat!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  defaultPickupLng!: number | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  firebaseToken!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId!: string | null;

  // Relationships
  @OneToMany(() => Order, order => order.user)
  orders!: Order[];

  @OneToMany(() => Driver, driver => driver.user)
  driverProfile!: Driver[];

  @OneToMany(() => Notification, notification => notification.user)
  notifications!: Notification[];
}