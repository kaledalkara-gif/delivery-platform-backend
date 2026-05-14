// src/modules/payments/payments.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel, NotificationPriority } from '../notifications/entities/notification.entity';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private stripe: Stripe; // ✅ Now TypeScript knows this type

    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private configService: ConfigService,
        private notificationsService: NotificationsService,
    ) {
        // Initialize Stripe with the secret key
        const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
        }

        this.stripe = new Stripe(stripeSecretKey, {
            // No apiVersion - let Stripe use its default
        });
    }

    async createPaymentIntent(orderId: string): Promise<{ clientSecret: string; paymentId: string }> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user'],
        });

        if (!order) {
            throw new Error('Order not found');
        }

        // Create or get Stripe customer
        let stripeCustomerId = order.user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await this.stripe.customers.create({
                email: order.user.email,
                name: order.user.name,
                metadata: {
                    userId: order.user.id,
                },
            });
            stripeCustomerId = customer.id;

            await this.userRepository.update(order.user.id, { stripeCustomerId });
        }

        // Create payment intent
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(order.totalAmount * 100),
            currency: 'usd',
            customer: stripeCustomerId,
            metadata: {
                orderId: order.id,
                userId: order.user.id,
            },
        });

        // Save payment record
        const payment = this.paymentRepository.create({
            orderId: order.id,
            amount: order.totalAmount,
            currency: 'usd',
            status: PaymentStatus.PENDING,
            method: PaymentMethod.CARD,
            stripePaymentIntentId: paymentIntent.id,
            stripeCustomerId: stripeCustomerId,
        });

        await this.paymentRepository.save(payment);

        return {
            clientSecret: paymentIntent.client_secret!,
            paymentId: payment.id,
        };
    }

    async handleWebhook(event: Stripe.Event): Promise<void> {
        this.logger.log(`Received Stripe webhook: ${event.type}`);

        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
                break;
            case 'payment_intent.payment_failed':
                await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
                break;
            default:
                this.logger.log(`Unhandled event type: ${event.type}`);
        }
    }

    private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
        const orderId = paymentIntent.metadata?.orderId;
        if (!orderId) {
            this.logger.warn('Payment intent has no orderId metadata');
            return;
        }

        const payment = await this.paymentRepository.findOne({
            where: { stripePaymentIntentId: paymentIntent.id },
            relations: ['order', 'order.user'],
        });

        if (!payment) {
            this.logger.warn(`Payment not found for intent: ${paymentIntent.id}`);
            return;
        }

        payment.status = PaymentStatus.SUCCEEDED;
        payment.paidAt = new Date();
        await this.paymentRepository.save(payment);

        const order = payment.order;
        if (order.status === OrderStatus.PENDING) {
            order.status = OrderStatus.VALIDATED;
            await this.orderRepository.save(order);
        }

        await this.notificationsService.create({
            userId: order.user.id,
            orderId: order.id,
            type: NotificationType.PAYMENT_RECEIVED,
            title: 'Payment Successful',
            body: `Your payment of $${payment.amount} has been confirmed. Your order is now being processed.`,
            channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
            priority: NotificationPriority.NORMAL,
        });

        this.logger.log(`Payment succeeded for order ${orderId}`);
    }

    private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
        const payment = await this.paymentRepository.findOne({
            where: { stripePaymentIntentId: paymentIntent.id },
            relations: ['order', 'order.user'],
        });

        if (payment) {
            payment.status = PaymentStatus.FAILED;
            await this.paymentRepository.save(payment);

            await this.notificationsService.create({
                userId: payment.order.user.id,
                orderId: payment.order.id,
                type: NotificationType.PAYMENT_FAILED,
                title: 'Payment Failed',
                body: `Your payment of $${payment.amount} could not be processed. Please try again.`,
                channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
                priority: NotificationPriority.HIGH,
            });
        }

        this.logger.error(`Payment failed for intent: ${paymentIntent.id}`);
    }

    async getPaymentStatus(orderId: string): Promise<Payment | null> {
        return this.paymentRepository.findOne({
            where: { orderId },
            order: { createdAt: 'DESC' },
        });
    }
}