import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string | undefined;
  private readonly sender: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SMS_API_KEY');
    this.sender = this.configService.get<string>('SMS_SENDER', 'MedClinic');

    if (!this.apiKey) {
      this.logger.warn(
        'SMS_API_KEY not configured. SMS messages will be logged to console.',
      );
    } else {
      this.logger.log('SMS service configured');
    }
  }

  async sendSms(phone: string, message: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.log(`[SMS FALLBACK] To: ${phone} | Message: ${message}`);
      return false;
    }

    try {
      // Integration point for SMS provider (e.g. Twilio, SMS.ru, PlayMobile).
      // Replace this block with the actual HTTP call to your provider's API.
      //
      // Example for a generic REST-based SMS gateway:
      // const response = await fetch('https://sms-provider.example/send', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.apiKey}`,
      //   },
      //   body: JSON.stringify({ phone, message, sender: this.sender }),
      // });
      // if (!response.ok) throw new Error(`SMS API returned ${response.status}`);

      this.logger.log(`SMS sent to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}: ${error.message}`);
      return false;
    }
  }
}
