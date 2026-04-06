import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SystemSettings } from './entities/system-settings.entity';
import { SmsService } from '../notifications/services/sms.service';
import { EmailService } from '../notifications/services/email.service';
import { IntegrationConfigItem } from './dto/integration.dto';

interface IntegrationKeyMeta {
  key: string;
  category: string;
  description: string;
  valueType?: string;
}

export const INTEGRATION_KEYS: IntegrationKeyMeta[] = [
  // SMS
  { key: 'sms.provider', category: 'sms', description: 'SMS provider (playmobile/twilio/smsru)' },
  { key: 'sms.api_key', category: 'sms', description: 'SMS provider API key' },
  { key: 'sms.sender', category: 'sms', description: 'SMS sender name' },
  // SMTP
  { key: 'smtp.host', category: 'smtp', description: 'SMTP server host' },
  { key: 'smtp.port', category: 'smtp', description: 'SMTP server port', valueType: 'number' },
  { key: 'smtp.user', category: 'smtp', description: 'SMTP username' },
  { key: 'smtp.password', category: 'smtp', description: 'SMTP password' },
  { key: 'smtp.from', category: 'smtp', description: 'SMTP from address' },
  // Telegram
  { key: 'telegram.bot_token', category: 'telegram', description: 'Telegram bot token' },
  // LIS
  { key: 'lis.endpoint', category: 'lis', description: 'Lab Information System endpoint' },
  { key: 'lis.api_key', category: 'lis', description: 'Lab Information System API key' },
  // EGISZ
  { key: 'egisz.endpoint', category: 'egisz', description: 'State Health System endpoint' },
  { key: 'egisz.credentials', category: 'egisz', description: 'State Health System credentials' },
  // Payment
  { key: 'payment.provider', category: 'payment', description: 'Payment provider name' },
  { key: 'payment.merchant_id', category: 'payment', description: 'Payment merchant id' },
  { key: 'payment.api_key', category: 'payment', description: 'Payment provider API key' },
];

const SECRET_PATTERNS = ['key', 'password', 'secret', 'token', 'credentials'];

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(SystemSettings)
    private readonly settingsRepository: Repository<SystemSettings>,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  private isSecretKey(key: string): boolean {
    const lower = key.toLowerCase();
    return SECRET_PATTERNS.some((p) => lower.includes(p));
  }

  private maskValue(value: string | null): string | null {
    if (!value) return value;
    if (value.length <= 3) return '***';
    return `***${value.slice(-3)}`;
  }

  private isKnownKey(key: string): IntegrationKeyMeta | undefined {
    return INTEGRATION_KEYS.find((k) => k.key === key);
  }

  async getAll(): Promise<IntegrationConfigItem[]> {
    const keys = INTEGRATION_KEYS.map((k) => k.key);
    const existing = await this.settingsRepository.find({ where: { key: In(keys) } });
    const existingMap = new Map(existing.map((s) => [s.key, s]));

    return INTEGRATION_KEYS.map((meta) => {
      const setting = existingMap.get(meta.key);
      const rawValue = setting?.value ?? null;
      const secret = this.isSecretKey(meta.key);
      return {
        key: meta.key,
        value: secret ? this.maskValue(rawValue) : rawValue,
        masked: secret,
        category: meta.category,
        description: meta.description,
      };
    });
  }

  async updateOne(key: string, value: string): Promise<IntegrationConfigItem> {
    const meta = this.isKnownKey(key);
    if (!meta) {
      throw new BadRequestException(`Unknown integration key: ${key}`);
    }

    let setting = await this.settingsRepository.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
      setting.category = meta.category;
      setting.description = meta.description;
      setting.valueType = meta.valueType || 'string';
    } else {
      setting = this.settingsRepository.create({
        key,
        value,
        category: meta.category,
        description: meta.description,
        valueType: meta.valueType || 'string',
      });
    }
    await this.settingsRepository.save(setting);

    const secret = this.isSecretKey(key);
    return {
      key,
      value: secret ? this.maskValue(value) : value,
      masked: secret,
      category: meta.category,
      description: meta.description,
    };
  }

  async testSms(
    phone: string,
    message?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const ok = await this.smsService.sendSms(
        phone,
        message || 'Test SMS from MedClinic integrations configuration.',
      );
      if (!ok) {
        return {
          success: false,
          error: 'SMS service did not accept the message (check provider configuration).',
        };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Unknown SMS error' };
    }
  }

  async testEmail(
    to: string,
    subject?: string,
    body?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const ok = await this.emailService.sendEmail(
        to,
        subject || 'Test email from MedClinic',
        body || '<p>This is a test email from MedClinic integrations configuration.</p>',
      );
      if (!ok) {
        return {
          success: false,
          error: 'Email service did not accept the message (check SMTP configuration).',
        };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Unknown SMTP error' };
    }
  }
}
