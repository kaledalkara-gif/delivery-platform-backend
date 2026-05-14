import { Controller, Post, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import Stripe from 'stripe';

@Controller('stripe')
export class WebhookController {
    private stripe: Stripe;

    constructor(
        private configService: ConfigService,
        private paymentsService: PaymentsService,
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

    @Post('webhook')
    async handleWebhook(@Req() req: RawBodyRequest<Request>) {
        const sig = req.headers['stripe-signature'] as string;
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(
                req.rawBody!,
                sig,
                webhookSecret,
            );
        } catch (error) {

            // Safe error handling
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Webhook signature verification failed: ${errorMessage}`);
            return { statusCode: 400, message: `Webhook Error: ${errorMessage}` };

        }

        await this.paymentsService.handleWebhook(event);

        return { received: true };
    }
}