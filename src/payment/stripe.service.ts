// src/payment/stripe.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2025-10-29.clover',
    });
  }

  async createPaymentIntent(amount: number): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Centlarda
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: paymentIntent.client_secret as string,
      paymentIntentId: paymentIntent.id,
    };
  }

  async retrievePaymentIntent(id: string) {
    return this.stripe.paymentIntents.retrieve(id);
  }
}