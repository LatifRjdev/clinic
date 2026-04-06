import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyAccount, LoyaltyTier } from './entities/loyalty-account.entity';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyAccount)
    private readonly loyaltyRepository: Repository<LoyaltyAccount>,
  ) {}

  private calculateTier(totalSpent: number): LoyaltyTier {
    if (totalSpent >= 5000) return LoyaltyTier.GOLD;
    if (totalSpent >= 1000) return LoyaltyTier.SILVER;
    return LoyaltyTier.BRONZE;
  }

  async getOrCreate(patientId: string): Promise<LoyaltyAccount> {
    let account = await this.loyaltyRepository.findOne({
      where: { patientId },
    });

    if (!account) {
      account = this.loyaltyRepository.create({
        patientId,
        points: 0,
        totalSpent: 0,
        tier: LoyaltyTier.BRONZE,
      });
      account = await this.loyaltyRepository.save(account);
    }

    return account;
  }

  async findByPatient(patientId: string): Promise<LoyaltyAccount> {
    return this.getOrCreate(patientId);
  }

  /**
   * Register a paid invoice against the patient's loyalty account.
   * Awards 1 point per 10 units spent and updates tier accordingly.
   */
  async registerPayment(
    patientId: string,
    amount: number,
  ): Promise<LoyaltyAccount> {
    if (!patientId || amount <= 0) {
      return this.getOrCreate(patientId);
    }

    const account = await this.getOrCreate(patientId);
    const earnedPoints = Math.floor(amount / 10);

    account.points = Number(account.points) + earnedPoints;
    account.totalSpent = Number(account.totalSpent) + Number(amount);
    account.tier = this.calculateTier(Number(account.totalSpent));

    return this.loyaltyRepository.save(account);
  }

  async adjustPoints(
    patientId: string,
    delta: number,
  ): Promise<LoyaltyAccount> {
    const account = await this.getOrCreate(patientId);
    const newPoints = Number(account.points) + delta;

    if (newPoints < 0) {
      throw new BadRequestException(
        'Adjustment would result in negative points balance',
      );
    }

    account.points = newPoints;
    return this.loyaltyRepository.save(account);
  }
}
