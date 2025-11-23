import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  //
  async sendMail(to: string, subject: string, text: string) {
    try {
      await this.transporter.sendMail({
        from: `"NoteShare Alerts" <${process.env.MAIL_USER}>`,
        to,
        subject,
        text,
      });
    } catch (e) {
      console.error("Mail send failed:", e);
    }
  }
}
