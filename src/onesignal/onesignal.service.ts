import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as OneSignal from 'onesignal-node';

@Injectable()
export class OneSignalService {
  private client: OneSignal.Client;

  constructor(private configService: ConfigService) {
    this.client = new OneSignal.Client(
      this.configService.get<string>('ONESIGNAL_APP_ID') as string,
      this.configService.get<string>('ONESIGNAL_REST_API_KEY') as string,
    );
  }

  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: any,
  ) {
    if (!tokens || tokens.length === 0)
      return { success: false, message: 'No tokens provided' };

    const message = {
      contents: { en: body },
      headings: { en: title },
      include_player_ids: tokens,
      data,
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
    };

    try {
      const response = await this.client.createNotification(message);
      console.log('✅ OneSignal push yuborildi:', response.body);
      return { success: true, response: response.body };
    } catch (error) {
      console.error('❌ OneSignal xatosi:', error);
      return { success: false, error };
    }
  }
}
