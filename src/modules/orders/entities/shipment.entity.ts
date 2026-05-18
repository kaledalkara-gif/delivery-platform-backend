// src/modules/orders/entities/shipment.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from './order.entity';
import { Driver } from '../../drivers/entities/driver.entity';

export enum ShipmentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

@Entity('shipments')
export class Shipment extends BaseEntity {
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver!: Driver | null;

  @Column({ name: 'driver_id', type: 'uuid', nullable: true })  // ✅ nullable: true
  driverId!: string | null;

  @Column({ type: 'enum', enum: ShipmentStatus, default: ShipmentStatus.PENDING })
  status!: ShipmentStatus;

  @Column({ type: 'text' })
  originAddress!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  originLatitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  originLongitude!: number;

  @Column({ type: 'text' })
  destinationAddress!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  destinationLatitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  destinationLongitude!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  calculatedDistanceKm!: number | null;

  @Column({ type: 'integer', nullable: true })
  estimatedDurationSeconds!: number | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  routeGeometry!: string | null;
}