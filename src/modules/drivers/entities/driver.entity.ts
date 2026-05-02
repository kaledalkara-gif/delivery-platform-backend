// src/modules/drivers/entities/driver.entity.ts
import { Entity, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { Shipment } from '../../orders/entities/shipment.entity';
import { DriverLocation } from './driver-location.entity';

export enum VehicleType {
  BICYCLE = 'bicycle',
  SMALL_CAR = 'small_car',
  LARGE_CAR = 'large_car',
  VAN = 'van',
}

export enum DriverStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  ON_PICKUP = 'on_pickup',
  ON_DELIVERY = 'on_delivery',
  ON_BREAK = 'on_break',
}

@Entity('drivers')
export class Driver extends BaseEntity {
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.SMALL_CAR })
  vehicleType!: VehicleType;

  @Column({ type: 'varchar', length: 20, nullable: true })
  vehiclePlate!: string | null;

  @Column({ type: 'enum', enum: DriverStatus, default: DriverStatus.OFFLINE })
  status!: DriverStatus;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLat!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLng!: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 50 })
  maxWeightKg!: number;

  @Column({ type: 'integer', default: 50000 })
  maxVolumeCm3!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  currentWeightKg!: number;

  @Column({ type: 'integer', default: 0 })
  currentVolumeCm3!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column({ type: 'integer', default: 0 })
  totalDeliveries!: number;

  // Relationships
  @OneToMany(() => Order, order => order.driver)
  orders!: Order[];

  @OneToMany(() => Shipment, shipment => shipment.driver)
  shipments!: Shipment[];

  @OneToMany(() => DriverLocation, location => location.driver)
  locations!: DriverLocation[];
}