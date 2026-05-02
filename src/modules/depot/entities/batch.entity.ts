// src/modules/depot/entities/batch.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BatchItem } from './batch-item.entity';

export enum BatchStatus {
  FORMING = 'forming',
  READY = 'ready',
  DISPATCHED = 'dispatched',
  COMPLETED = 'completed',
}

@Entity('batches')
export class Batch extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  zoneName!: string; // e.g., "North Zone", "Downtown"

  @Column({ type: 'enum', enum: BatchStatus, default: BatchStatus.FORMING })
  status!: BatchStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedDriverId!: string;

  @Column({ type: 'timestamp', nullable: true })
  dispatchedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date;

  @OneToMany(() => BatchItem, item => item.batch, { cascade: true })
  items!: BatchItem[];
}