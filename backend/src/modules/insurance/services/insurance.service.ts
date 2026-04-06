import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InsuranceCompany } from '../entities/insurance-company.entity';
import { InsuranceRegistry, RegistryStatus } from '../entities/insurance-registry.entity';
import { CreateInsuranceCompanyDto } from '../dto/create-insurance-company.dto';
import { UpdateInsuranceCompanyDto } from '../dto/update-insurance-company.dto';
import { RedisCacheService } from '../../cache/cache.service';

const INSURANCE_COMPANIES_CACHE_KEY_ALL = 'insurance:companies:all';
const INSURANCE_COMPANIES_CACHE_KEY_ACTIVE = 'insurance:companies:active';

@Injectable()
export class InsuranceService {
  constructor(
    @InjectRepository(InsuranceCompany)
    private readonly companyRepository: Repository<InsuranceCompany>,
    @InjectRepository(InsuranceRegistry)
    private readonly registryRepository: Repository<InsuranceRegistry>,
    private readonly cacheService: RedisCacheService,
  ) {}

  private async invalidateCompaniesCache(): Promise<void> {
    await Promise.all([
      this.cacheService.del(INSURANCE_COMPANIES_CACHE_KEY_ALL),
      this.cacheService.del(INSURANCE_COMPANIES_CACHE_KEY_ACTIVE),
    ]);
  }

  // --- Insurance Companies ---

  async createCompany(dto: CreateInsuranceCompanyDto): Promise<InsuranceCompany> {
    const company = this.companyRepository.create(dto);
    const saved = await this.companyRepository.save(company);
    await this.invalidateCompaniesCache();
    return saved;
  }

  async findAllCompanies(activeOnly = false): Promise<InsuranceCompany[]> {
    const key = activeOnly
      ? INSURANCE_COMPANIES_CACHE_KEY_ACTIVE
      : INSURANCE_COMPANIES_CACHE_KEY_ALL;
    return this.cacheService.getOrSet(
      key,
      async () => {
        const where = activeOnly ? { isActive: true } : {};
        return this.companyRepository.find({ where, order: { name: 'ASC' } });
      },
      300,
    );
  }

  async findOneCompany(id: string): Promise<InsuranceCompany> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Insurance company #${id} not found`);
    return company;
  }

  async updateCompany(id: string, dto: UpdateInsuranceCompanyDto): Promise<InsuranceCompany> {
    const company = await this.findOneCompany(id);
    Object.assign(company, dto);
    const saved = await this.companyRepository.save(company);
    await this.invalidateCompaniesCache();
    return saved;
  }

  async removeCompany(id: string): Promise<void> {
    const company = await this.findOneCompany(id);
    await this.companyRepository.softRemove(company);
    await this.invalidateCompaniesCache();
  }

  // --- Insurance Registries ---

  async createRegistry(
    companyId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<InsuranceRegistry> {
    await this.findOneCompany(companyId);

    const count = await this.registryRepository.count();
    const registryNumber = `REG-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const registry = this.registryRepository.create({
      insuranceCompanyId: companyId,
      registryNumber,
      periodStart,
      periodEnd,
    });

    return this.registryRepository.save(registry);
  }

  async findAllRegistries(companyId?: string): Promise<InsuranceRegistry[]> {
    const qb = this.registryRepository.createQueryBuilder('r');
    if (companyId) {
      qb.where('r.insurance_company_id = :companyId', { companyId });
    }
    return qb.orderBy('r.created_at', 'DESC').getMany();
  }

  async findOneRegistry(id: string): Promise<InsuranceRegistry> {
    const registry = await this.registryRepository.findOne({ where: { id } });
    if (!registry) throw new NotFoundException(`Registry #${id} not found`);
    return registry;
  }

  async submitRegistry(id: string): Promise<InsuranceRegistry> {
    const registry = await this.findOneRegistry(id);
    if (registry.status !== RegistryStatus.DRAFT) {
      throw new BadRequestException('Only draft registries can be submitted');
    }
    registry.status = RegistryStatus.SUBMITTED;
    registry.submittedAt = new Date();
    return this.registryRepository.save(registry);
  }

  async updateRegistryStatus(
    id: string,
    status: RegistryStatus,
  ): Promise<InsuranceRegistry> {
    const registry = await this.findOneRegistry(id);
    registry.status = status;
    if (status === RegistryStatus.PAID) {
      registry.paidAt = new Date();
    }
    return this.registryRepository.save(registry);
  }

  // --- Coverage check ---

  async checkCoverage(
    companyId: string,
    serviceCode: string,
  ): Promise<{ covered: boolean; discountPercent: number }> {
    const company = await this.findOneCompany(companyId);
    // Simplified: all services covered with company's discount
    return {
      covered: company.isActive,
      discountPercent: Number(company.discountPercent),
    };
  }

  /**
   * Verify that a patient's insurance policy is valid for use.
   * Checks: company exists, company is active, contract window covers `onDate`.
   * Returns a structured result instead of throwing — callers decide how to react.
   */
  async verifyPolicy(
    companyId: string,
    policyNumber?: string | null,
    onDate: Date = new Date(),
  ): Promise<{ valid: boolean; reason?: string; discountPercent: number }> {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) {
      return { valid: false, reason: 'Страховая компания не найдена', discountPercent: 0 };
    }
    if (!company.isActive) {
      return { valid: false, reason: 'Договор со страховой компанией неактивен', discountPercent: 0 };
    }

    const checkDate = onDate instanceof Date ? onDate : new Date(onDate);
    if (company.contractStart && new Date(company.contractStart) > checkDate) {
      return { valid: false, reason: 'Договор страхования ещё не начался', discountPercent: 0 };
    }
    if (company.contractEnd && new Date(company.contractEnd) < checkDate) {
      return { valid: false, reason: 'Срок действия договора страхования истёк', discountPercent: 0 };
    }

    if (policyNumber !== undefined && policyNumber !== null && policyNumber.trim() === '') {
      return { valid: false, reason: 'Не указан номер полиса', discountPercent: 0 };
    }

    return { valid: true, discountPercent: Number(company.discountPercent) };
  }

  /**
   * Generate a reconciliation act (акт сверки) for an insurance registry.
   * Returns structured data suitable for PDF rendering later.
   */
  async generateRegistryReconciliationAct(id: string): Promise<{
    actNumber: string;
    actDate: string;
    registry: {
      id: string;
      number: string;
      periodStart: Date;
      periodEnd: Date;
      status: RegistryStatus;
      totalAmount: number;
      itemsCount: number;
      submittedAt: Date | null;
      paidAt: Date | null;
    };
    company: {
      id: string;
      name: string;
      code: string;
      contractNumber: string | null;
      address: string | null;
      phone: string | null;
    };
    balances: {
      registryAmount: number;
      paidAmount: number;
      outstandingAmount: number;
    };
    notes: string | null;
  }> {
    const registry = await this.findOneRegistry(id);
    const company = await this.findOneCompany(registry.insuranceCompanyId);

    const registryAmount = Number(registry.totalAmount) || 0;
    const paidAmount = registry.status === RegistryStatus.PAID ? registryAmount : 0;
    const outstandingAmount = +(registryAmount - paidAmount).toFixed(2);

    return {
      actNumber: `ACT-INS-${registry.registryNumber}`,
      actDate: new Date().toISOString().slice(0, 10),
      registry: {
        id: registry.id,
        number: registry.registryNumber,
        periodStart: registry.periodStart,
        periodEnd: registry.periodEnd,
        status: registry.status,
        totalAmount: registryAmount,
        itemsCount: registry.itemsCount,
        submittedAt: registry.submittedAt,
        paidAt: registry.paidAt,
      },
      company: {
        id: company.id,
        name: company.name,
        code: company.code,
        contractNumber: company.contractNumber,
        address: company.address,
        phone: company.phone,
      },
      balances: {
        registryAmount,
        paidAmount,
        outstandingAmount,
      },
      notes: registry.notes,
    };
  }
}
