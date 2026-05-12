// src/common/entities/base.entity.ts
import { CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
