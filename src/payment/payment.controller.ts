// src/payment/payment.controller.ts
import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../common/jwt-strategy/jwt-guards';

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('intent/:noteId')
  createIntent(@Param('noteId') noteId: number, @Req() req) {
    if (!noteId) {
      throw new Error('Note ID is required');
    }
    return this.paymentService.createPaymentIntent(+noteId, req.user.sub);
  }

  @Post('confirm/:intentId')
  confirm(@Param('intentId') intentId: string) {
    if (!intentId) {
      throw new Error('Payment Intent ID is required');
    }
    return this.paymentService.confirmPayment(intentId);
  }
}