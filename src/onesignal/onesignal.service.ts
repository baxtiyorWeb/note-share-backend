import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as OneSignal from 'onesignal-node';

@Injectable()
export class OneSignalService {
  private client: OneSignal.Client;
  private readonly logger = new Logger(OneSignalService.name);

  constructor(private configService: ConfigService) {
    this.client = new OneSignal.Client(
      this.configService.get<string>('ONESIGNAL_APP_ID')!,
      this.configService.get<string>('ONESIGNAL_REST_API_KEY')!,
    );
  }

  async sendPushNotification(
    playerIds: string[],
    title: string,
    message: string,
    data?: any,
  ) {
    if (!playerIds || playerIds.length === 0) {
      this.logger.warn('⚠️ Player ID mavjud emas.');
      return;
    }

    const notification = {
      app_id: this.configService.get<string>('ONESIGNAL_APP_ID'),
      include_player_ids: playerIds,
      contents: { en: message },
      headings: { en: title },
      data,
    };

    try {
      const response = await this.client.createNotification(notification);
      this.logger.log(`✅ Push yuborildi: ${JSON.stringify(response.body)}`);
      return response.body;
    } catch (error) {
      this.logger.error('❌ Push yuborishda xatolik:', error);
    }
  }
}
