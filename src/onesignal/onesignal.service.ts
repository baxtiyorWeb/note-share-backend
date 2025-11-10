import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OneSignal from 'onesignal-node';

@Injectable()
export class OneSignalService {
  private client: OneSignal.Client;

  constructor(private configService: ConfigService) {
    this.client = new OneSignal.Client(
      this.configService.get('ONESIGNAL_APP_ID') as string,
      this.configService.get('ONESIGNAL_REST_API_KEY') as string,
    );
  }

  async sendPushNotification(
    tokens: string[], // User FCM/HMS tokens (OneSignal orqali)
    title: string,
    body: string,
    data?: any, // { noteId: '27', type: 'reminder' }
  ) {
    if (!tokens.length) return { success: false, message: 'No tokens' };

    const message = {
      contents: { en: body }, // O'zbekcha uchun 'uz' qo'shing
      headings: { en: title },
      include_player_ids: tokens, // Individual tokens
      data: data, // Deep link uchun
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
    };

    try {
      const response = await this.client.createNotification(message);
      console.log('OneSignal Push yuborildi:', response.body);
      return { success: true, response: response.body };
    } catch (error) {
      console.error('OneSignal xatosi:', error);
      return { success: false, error };
    }
  }
}