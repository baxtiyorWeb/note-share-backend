import { Injectable } from "@nestjs/common";
import OpenAI from "openai";

@Injectable()
export class AiService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  async summarizeNotifications(notifs: string[]): Promise<string> {
    const prompt = `
    Summarize these notifications in 1 short sentence:
    ${notifs.join("\n")}
    `;
    const res = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return res.choices[0].message.content ?? "";
  }

  async summarize(text: string): Promise<string> {
    const prompt = `
      Summarize this note in 1 short and clear paragraph:
      ${text}
    `;

    const res = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return res.choices[0].message.content ?? "";
  }
}
