// src/modules/orders/entities/package.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from './order.entity';

export enum PackageCondition {
  GOOD = 'good',
  MINOR_DAMAGE = 'minor_damage',
  SIGNIFICANT_DAMAGE = 'significant_damage',
}

export enum PackageType {
  ENVELOPE = 'envelope',
  SMALL_BOX = 'small_box',
  MEDIUM_BOX = 'medium_box',
  LARGE_CARTON = 'large_carton',
}

@Entity('packages')
export class Package extends BaseEntity {
  @ManyToOne(() => Order, order => order.packages)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ type: 'enum', enum: PackageType, default: PackageType.SMALL_BOX })
  type!: PackageType;

  @Column({ type: 'integer' })
  lengthCm!: number;

  @Column({ type: 'integer' })
  widthCm!: number;

  @Column({ type: 'integer' })
  heightCm!: number;

  @Column({ type: 'integer' })
  volumeCm3!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  weightKg!: number;

  @Column({ type: 'boolean', default: false })
  isFragile!: boolean;

  @Column({ type: 'boolean', default: false })
  isPerishable!: boolean;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: PackageCondition, default: PackageCondition.GOOD })
  conditionAtPickup!: PackageCondition;

  @Column({ type: 'text', nullable: true })
  pickupPhotoUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  pickupPhotoLocationUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  deliveryPhotoUrl!: string | null;
}