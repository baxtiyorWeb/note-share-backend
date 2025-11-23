// src/payment/entities/payment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotesEntity } from '../../notes/entities/notes.entity';
import { ProfileEntity } from '../../profile/entities/profile.entity';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  stripePaymentIntentId: string; // Stripe ID

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // Masalan: 2.99

  @Column({ default: 'usd' })
  currency: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';

  @Column({ type: 'jsonb', nullable: true })
  stripeData: any; // Stripe webhook dan kelgan ma'lumotlar

  @ManyToOne(() => NotesEntity, (note) => note.payments, { onDelete: 'CASCADE' })
  note: NotesEntity;

  @ManyToOne(() => ProfileEntity, (profile) => profile.payments, { onDelete: 'CASCADE' })
  buyer: ProfileEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}