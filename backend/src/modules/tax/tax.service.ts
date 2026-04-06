import { BadRequestException, Injectable } from '@nestjs/common';

export type TaxType = 'vat' | 'income' | 'social' | 'property' | 'simplified';

export interface TaxDeadline {
  code: string;
  title: string;
  titleRu: string;
  frequency: 'monthly' | 'quarterly' | 'annual';
  dueDay: number; // day of the month
  months: number[]; // applicable months (1-12)
  description: string;
}

export interface TaxCalendarEntry {
  code: string;
  title: string;
  titleRu: string;
  frequency: TaxDeadline['frequency'];
  dueDate: string; // ISO date
  description: string;
}

/**
 * Tajikistan tax rates and deadlines (Phase 2.4).
 * Rates are simplified defaults; adjust as legislation changes.
 */
const TAX_RATES: Record<TaxType, { rate: number; nameRu: string }> = {
  // НДС - Value Added Tax
  vat: { rate: 0.14, nameRu: 'НДС' },
  // Подоходный налог - Personal income tax
  income: { rate: 0.13, nameRu: 'Подоходный налог' },
  // Социальный налог - Social tax
  social: { rate: 0.25, nameRu: 'Социальный налог' },
  // Налог на имущество - Property tax
  property: { rate: 0.01, nameRu: 'Налог на имущество' },
  // Упрощённый налог - Simplified tax regime
  simplified: { rate: 0.06, nameRu: 'Упрощённый налог' },
};

const TAX_DEADLINES: TaxDeadline[] = [
  {
    code: 'vat',
    title: 'VAT declaration and payment',
    titleRu: 'Декларация и уплата НДС',
    frequency: 'monthly',
    dueDay: 15,
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description: 'Monthly VAT declaration and payment due by the 15th of the following month',
  },
  {
    code: 'social',
    title: 'Social tax payment',
    titleRu: 'Уплата социального налога',
    frequency: 'monthly',
    dueDay: 20,
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description: 'Monthly social tax due by the 20th of the following month',
  },
  {
    code: 'income_withholding',
    title: 'Personal income tax withholding',
    titleRu: 'Подоходный налог с зарплаты (удержание)',
    frequency: 'monthly',
    dueDay: 15,
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description: 'Monthly PIT withheld from salaries, due by the 15th of the following month',
  },
  {
    code: 'income_corporate',
    title: 'Corporate income tax (quarterly advance)',
    titleRu: 'Налог на прибыль (квартальный аванс)',
    frequency: 'quarterly',
    dueDay: 15,
    months: [4, 7, 10, 1],
    description: 'Quarterly advance corporate income tax payment',
  },
  {
    code: 'property',
    title: 'Property tax',
    titleRu: 'Налог на имущество',
    frequency: 'annual',
    dueDay: 15,
    months: [3],
    description: 'Annual property tax declaration and payment',
  },
  {
    code: 'annual_report',
    title: 'Annual financial report',
    titleRu: 'Годовой финансовый отчёт',
    frequency: 'annual',
    dueDay: 1,
    months: [4],
    description: 'Annual financial statements submission to tax authorities',
  },
];

@Injectable()
export class TaxService {
  /**
   * Returns the tax calendar for the given year (defaults to current year).
   * Each deadline is expanded to actual dates for every applicable month.
   */
  getCalendar(year?: number): { year: number; entries: TaxCalendarEntry[] } {
    const targetYear = year ?? new Date().getFullYear();
    const entries: TaxCalendarEntry[] = [];

    for (const deadline of TAX_DEADLINES) {
      for (const month of deadline.months) {
        const date = new Date(Date.UTC(targetYear, month - 1, deadline.dueDay));
        entries.push({
          code: deadline.code,
          title: deadline.title,
          titleRu: deadline.titleRu,
          frequency: deadline.frequency,
          dueDate: date.toISOString().slice(0, 10),
          description: deadline.description,
        });
      }
    }

    entries.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return { year: targetYear, entries };
  }

  /**
   * Simple tax calculator for Tajikistan.
   * For VAT: returns both "VAT included in amount" and "VAT on top" variants.
   */
  calculate(
    type: string,
    amount: number,
  ): {
    type: TaxType;
    nameRu: string;
    rate: number;
    amount: number;
    tax: number;
    net: number;
    gross: number;
    vatIncluded?: number;
    vatOnTop?: number;
  } {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      throw new BadRequestException('Parameter "amount" must be a valid number');
    }
    const normalizedType = (type ?? '').toLowerCase() as TaxType;
    const config = TAX_RATES[normalizedType];
    if (!config) {
      throw new BadRequestException(
        `Unknown tax type "${type}". Supported: ${Object.keys(TAX_RATES).join(', ')}`,
      );
    }
    const amt = Number(amount);
    const tax = +(amt * config.rate).toFixed(2);
    const result = {
      type: normalizedType,
      nameRu: config.nameRu,
      rate: config.rate,
      amount: amt,
      tax,
      net: +(amt - tax).toFixed(2),
      gross: +(amt + tax).toFixed(2),
    };

    if (normalizedType === 'vat') {
      return {
        ...result,
        vatIncluded: +(amt - amt / (1 + config.rate)).toFixed(2), // VAT part when amount already includes VAT
        vatOnTop: tax, // VAT added on top of the amount
      };
    }
    return result;
  }

  getRates(): Record<TaxType, { rate: number; nameRu: string }> {
    return TAX_RATES;
  }
}
