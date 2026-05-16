// src/modules/health/health.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

@Module({
    imports: [TypeOrmModule], // Make sure TypeOrmModule is available
    controllers: [HealthController],
})
export class HealthModule { }