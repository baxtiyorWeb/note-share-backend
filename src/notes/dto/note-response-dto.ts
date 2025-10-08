import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class NoteResponseDto {
  @ApiProperty({ description: 'Note ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Sarlavha', example: 'Meeting Notes' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Qisqa mazmun', example: 'Discussed project timeline...' })
  @Expose()
  contentPreview: string;

  @ApiProperty({ description: 'Yangilangan sana', example: '2025-01-15T10:30:00' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: 'Ulashgan foydalanuvchilar soni', example: 2 })
  @Expose()
  sharedCount: number;
}