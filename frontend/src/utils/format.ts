// Multi-currency formatting utilities.
//
// Currency is a pure display concern: no conversion is performed. The symbol
// shown is driven by the `default_currency` system setting (exposed via
// `GET /public/currency`), or an explicit per-call override, or the user's
// personal setting stored on the auth settings object.
//
// To avoid React context plumbing in every formatter call, the resolved
// currency code is cached in `localStorage` under `app.currency` and also in
// a module-level variable. Call `setRuntimeCurrency()` once at app startup
// (see `App.tsx` / currency bootstrap) to hydrate it.

export type CurrencyCode = 'TJS' | 'USD' | 'EUR' | 'RUB';

export interface CurrencyDescriptor {
  code: CurrencyCode;
  symbol: string;
  /** If true, symbol is shown after the amount with a space ("1,500.00 $"). */
  suffix: boolean;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyDescriptor> = {
  TJS: { code: 'TJS', symbol: 'сомонӣ', suffix: true },
  USD: { code: 'USD', symbol: '$', suffix: true },
  EUR: { code: 'EUR', symbol: '€', suffix: true },
  RUB: { code: 'RUB', symbol: '₽', suffix: true },
};

const STORAGE_KEY = 'app.currency';
const DEFAULT_CURRENCY: CurrencyCode = 'TJS';

let runtimeCurrency: CurrencyCode | null = null;

function normalize(code: string | null | undefined): CurrencyCode {
  if (!code) return DEFAULT_CURRENCY;
  const upper = code.toUpperCase() as CurrencyCode;
  return (SUPPORTED_CURRENCIES[upper] ? upper : DEFAULT_CURRENCY);
}

/** Called once at startup (or whenever the system/user currency changes). */
export function setRuntimeCurrency(code: string | null | undefined): void {
  const normalized = normalize(code);
  runtimeCurrency = normalized;
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

/** Returns the currency that should be used if no explicit one is passed. */
export function getRuntimeCurrency(): CurrencyCode {
  if (runtimeCurrency) return runtimeCurrency;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      runtimeCurrency = normalize(stored);
      return runtimeCurrency;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_CURRENCY;
}

/** Returns just the symbol (e.g. "сомонӣ", "$", "€", "₽"). */
export function getCurrencySymbol(currency?: string): string {
  const code = normalize(currency || getRuntimeCurrency());
  return SUPPORTED_CURRENCIES[code].symbol;
}

export interface FormatCurrencyOptions {
  /** Override currency for this call. */
  currency?: string;
  /** Number of decimal digits. Defaults to 2. Pass 0 for integer formatting. */
  decimals?: number;
  /** Locale for grouping separators. Defaults to 'ru-RU'. */
  locale?: string;
  /** If false, omit the symbol (returns only the formatted number). */
  withSymbol?: boolean;
}

/**
 * Format a monetary amount with the configured currency symbol.
 *
 *   formatCurrency(1500)         // "1 500,00 сомонӣ" (TJS, ru-RU locale)
 *   formatCurrency(1500, 'USD')  // "1 500,00 $"
 *   formatCurrency(1500, { decimals: 0 }) // "1 500 сомонӣ"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencyOrOptions?: string | FormatCurrencyOptions,
): string {
  const opts: FormatCurrencyOptions =
    typeof currencyOrOptions === 'string'
      ? { currency: currencyOrOptions }
      : currencyOrOptions || {};

  const code = normalize(opts.currency || getRuntimeCurrency());
  const descriptor = SUPPORTED_CURRENCIES[code];
  const decimals = opts.decimals ?? 2;
  const locale = opts.locale ?? 'ru-RU';
  const withSymbol = opts.withSymbol ?? true;

  const num = Number(amount);
  const safe = Number.isFinite(num) ? num : 0;

  const formatted = safe.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (!withSymbol) return formatted;
  return descriptor.suffix
    ? `${formatted} ${descriptor.symbol}`
    : `${descriptor.symbol} ${formatted}`;
}
