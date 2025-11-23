// src/export/export.service.ts
import { Injectable } from '@nestjs/common';
import { NotesEntity } from '../notes/entities/notes.entity';
import * as fs from 'fs';
import * as path from 'path';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UploadService } from './../file/uploadService';

@Injectable()
export class ExportService {
  constructor(private readonly uploadService: UploadService) { }

  async generate(note: NotesEntity, format: 'pdf' | 'json'): Promise<string> {
    let filePath = ''; // TypeScript xatosini oldini oladi

    // JSON EXPORT
    if (format === 'json') {
      const jsonData = {
        id: note.id,
        title: note.title,
        content: note.content,
        author: note.profile?.username,
        createdAt: note.createdAt,
        tags: note.tags,
      };

      filePath = path.join(__dirname, `../../../tmp/${note.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    }

    // PDF EXPORT
    if (format === 'pdf') {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(note.title, 20, 20);

      doc.setFontSize(12);
      doc.text(note.content, 20, 30);

      // 🟢 AUTO TABLE TO‘G‘RI YO‘LI
      autoTable(doc, {
        head: [['Author', 'Date']],
        body: [[note.profile.username, note.createdAt]],
      });

      filePath = path.join(__dirname, `../../../tmp/${note.id}.pdf`);
      doc.save(filePath);
    }

    // Vercel Blob ga yuklash
    const url = await this.uploadService.uploadFileFromPath(filePath);

    fs.unlinkSync(filePath); // vaqtinchalik faylni o'chirish

    return url;
  }
}
