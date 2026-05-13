import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from '../../orders/entities/order.entity';

export enum ProofType {
    PHOTO = 'photo',
    SIGNATURE = 'signature',
}

@Entity('proofs')
export class Proof extends BaseEntity {
    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order!: Order;

    @Column({ name: 'order_id', type: 'uuid' })
    orderId!: string;

    @Column({ type: 'enum', enum: ProofType })
    type!: ProofType;

    @Column({ type: 'text' })
    fileUrl!: string;

    @Column({ type: 'text', nullable: true })
    fileName!: string | null;

    @Column({ type: 'integer', nullable: true })
    fileSize!: number | null;

    @Column({ type: 'text', nullable: true })
    mimeType!: string | null;

    @Column({ type: 'text', nullable: true })
    recipientName!: string | null;

    @Column({ type: 'text', nullable: true })
    recipientPhone!: string | null;

    @Column({ type: 'text', nullable: true })
    notes!: string | null;

    @Column({ type: 'timestamp', nullable: true })
    capturedAt!: Date | null;
}