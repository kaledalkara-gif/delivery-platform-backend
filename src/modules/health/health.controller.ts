// src/modules/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
    constructor(
        @InjectDataSource()
        private dataSource: DataSource,
    ) { }

    @Get()
    async check() {
        // Check database connection
        let dbStatus = 'disconnected';
        let dbDetails = {};

        try {
            // Check if database is connected
            if (this.dataSource.isInitialized) {
                // Run a simple query to verify
                const result = await this.dataSource.query('SELECT 1 as connected');
                if (result && result[0]?.connected === 1) {
                    dbStatus = 'connected';
                    dbDetails = {
                        isInitialized: true,
                        driver: this.dataSource.driver?.constructor?.name || 'unknown',
                    };
                } else {
                    dbStatus = 'error';
                }
            } else {
                dbStatus = 'disconnected';
            }
        } catch (error) {
            // Safe error handling
            const errorMessage = error instanceof Error ? error.message : String(error);
            dbStatus = 'error';
            dbDetails = { error: errorMessage };
        }

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: {
                database: {
                    status: dbStatus,
                    details: dbDetails,
                },
                api: {
                    status: 'running',
                    port: process.env.PORT || 3000,
                },
            },
            memory: {
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
                heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            },
            environment: process.env.NODE_ENV || 'development',
        };
    }
}