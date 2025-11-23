// src/file/upload.service.ts
import { Injectable } from '@nestjs/common';
import { put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      const blob = await put(file.originalname, file.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });

      return blob.url;
    } catch (error) {
      console.error('Vercel Blob yuklashda xatolik:', error);
      throw new Error('Vercel Blob-ga fayl yuklashda muammo yuz berdi!');
    }
  }

  // ⭐ FAYL PATH YO'LI ORQALI YUKLASH (JSON/PDF uchun)
  async uploadFileFromPath(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const blob = await put(fileName, buffer, {
      access: 'public',
      addRandomSuffix: true,
    });

    return blob.url;
  }
}
