// src/payment/payment.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { StripeService } from './stripe.service';
import { NotesService } from '../notes/notes.service';
import { NotesEntity } from './../notes/entities/notes.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    private readonly stripeService: StripeService,
    private readonly notesService: NotesService,
    @InjectRepository(NotesEntity)
    private readonly noteRepo: Repository<NotesEntity>,
  ) { }

  // Paywall note uchun to'lov yaratish
  async createPaymentIntent(noteId: number, userId: number): Promise<{ clientSecret: string }> {
    const profile = await this.notesService.ensureProfile(userId);
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new BadRequestException('Note not found');
    if (!note.is_paywall) throw new BadRequestException('Not a paywall note');

    const amount = parseFloat(note.paywall_price || '0');
    if (amount <= 0) throw new BadRequestException('Invalid price');

    const { clientSecret, paymentIntentId } = await this.stripeService.createPaymentIntent(amount);

    const payment = this.paymentRepo.create({
      stripePaymentIntentId: paymentIntentId,
      amount,
      currency: 'usd',
      status: 'pending',
      note,
      buyer: profile,
    });
    await this.paymentRepo.save(payment);

    return { clientSecret };
  }

  // To'lovni tasdiqlash (webhook yoki confirm)
  async confirmPayment(stripePaymentIntentId: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepo.findOne({ where: { stripePaymentIntentId } });
    if (!payment) throw new BadRequestException('Payment not found');

    // Stripe dan tasdiqlash
    const stripePayment = await this.stripeService.retrievePaymentIntent(stripePaymentIntentId);
    if (stripePayment.status === 'succeeded') {
      payment.status = 'succeeded';
      payment.stripeData = stripePayment;
      await this.paymentRepo.save(payment);
    }

    return payment;
  }

  // Foydalanuvchi to'lovini tekshirish
  async hasPaidForNote(userId: number, noteId: number): Promise<boolean> {
    const profile = await this.notesService.ensureProfile(userId);
    const paid = await this.paymentRepo.findOne({
      where: { note: { id: noteId }, buyer: { id: profile.id }, status: 'succeeded' },
    });
    return !!paid;
  }
}