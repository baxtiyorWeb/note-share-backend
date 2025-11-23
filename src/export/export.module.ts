// src/export/export.module.ts
import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { UploadService } from '../file/uploadService';

@Module({
  providers: [ExportService, UploadService],
  exports: [ExportService],
})
export class ExportModule { }