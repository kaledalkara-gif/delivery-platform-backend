// src/modules/depot/entities/batch-item.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Batch } from './batch.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('batch_items')
export class BatchItem extends BaseEntity {
  @ManyToOne(() => Batch, batch => batch.items)
  @JoinColumn({ name: 'batch_id' })
  batch!: Batch;

  @Column({ name: 'batch_id', type: 'uuid' })
  batchId!: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ type: 'integer' })
  deliverySequence!: number; // Order of delivery within the batch

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt!: Date;
}