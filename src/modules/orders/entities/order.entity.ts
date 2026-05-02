// src/modules/orders/entities/order.entity.ts
import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Package } from './package.entity';
import { Shipment } from './shipment.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum OrderStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  ASSIGNED = 'assigned',
  PICKUP_IN_PROGRESS = 'pickup_in_progress',
  PICKUP_COMPLETED = 'pickup_completed',
  WITH_DRIVER = 'with_driver',
  AT_DEPOT = 'at_depot',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum DeliveryMode {
  EXPRESS_DIRECT = 'express_direct',
  STANDARD_DEPOT = 'standard_depot',
}

export enum TimeWindowPreference {
  ASAP = 'asap',
  SPECIFIC = 'specific',
}

@Entity('orders')
export class Order extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver!: Driver | null;

  @Column({ name: 'driver_id', type: 'uuid', nullable: true })
  driverId!: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Column({ type: 'enum', enum: DeliveryMode })
  deliveryMode!: DeliveryMode;

  // Pickup information
  @Column({ type: 'text' })
  pickupAddress!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  pickupLatitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  pickupLongitude!: number;

  @Column({ type: 'text', nullable: true })
  pickupInstructions!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pickupContactName!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pickupContactPhone!: string | null;

  // Dropoff information
  @Column({ type: 'text' })
  dropoffAddress!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  dropoffLatitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  dropoffLongitude!: number;

  @Column({ type: 'text', nullable: true })
  dropoffInstructions!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dropoffContactName!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dropoffContactPhone!: string | null;

  @Column({ type: 'enum', enum: TimeWindowPreference, default: TimeWindowPreference.ASAP })
  timeWindowPreference!: TimeWindowPreference;

  @Column({ type: 'timestamp', nullable: true })
  pickupEarliestTime!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  pickupLatestTime!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deliveryEarliestTime!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deliveryLatestTime!: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  driverEarnings!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platformFee!: number;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  pickupArrivalAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  pickupCompletedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  depotArrivalAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  depotDepartureAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt!: Date | null;

  @Column({ type: 'varchar', length: 6, nullable: true })
  deliveryOtp!: string | null;

  // Relationships
  @OneToMany(() => Package, pkg => pkg.order, { cascade: true })
  packages!: Package[];

  @OneToMany(() => Shipment, shipment => shipment.order)
  shipments!: Shipment[];

  @OneToMany(() => Payment, payment => payment.order)
  payments!: Payment[];
}