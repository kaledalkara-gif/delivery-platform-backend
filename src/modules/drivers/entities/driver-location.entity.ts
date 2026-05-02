// src/modules/drivers/entities/driver-location.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Driver } from './driver.entity';

@Entity('driver_locations')
@Index(['driverId', 'recordedAt'])
export class DriverLocation extends BaseEntity {
  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driver_id' })
  driver!: Driver;

  @Column({ name: 'driver_id', type: 'uuid' })
  driverId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: number;

  @Column({ type: 'integer', nullable: true })
  accuracy!: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  recordedAt!: Date;
}