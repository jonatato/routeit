export interface CurrencyPreference {
  from: string;
  to: string;
  updatedAt: string;
}

export interface CurrencyQuote {
  amount: number;
  convertedAmount: number;
  from: string;
  to: string;
  rate: number;
  date: string;
  fetchedAt: string;
  source: 'network' | 'cache' | 'identity';
  stale: boolean;
}

interface RateCacheEntry {
  base: string;
  requestedDate: string | null;
  effectiveDate: string;
  fetchedAt: string;
  rates: Record<string, number>;
}

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

const FRANKFURTER_API_ROOT = 'https://api.frankfurter.app';
const RATE_CACHE_PREFIX = 'routeit:currency-rates';
export const GLOBAL_CURRENCY_PREFERENCE_KEY = 'routeit:currency-pref:global';
const LATEST_RATE_TTL_MS = 24 * 60 * 60 * 1000;

export const POPULAR_CURRENCIES = [
  'AUD',
  'BRL',
  'CAD',
  'CHF',
  'CNY',
  'CZK',
  'DKK',
  'EUR',
  'GBP',
  'HKD',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'ISK',
  'JPY',
  'KRW',
  'MXN',
  'MYR',
  'NOK',
  'NZD',
  'PHP',
  'PLN',
  'RON',
  'SEK',
  'SGD',
  'THB',
  'TRY',
  'USD',
  'ZAR',
] as const;

const todayDate = () => new Date().toISOString().slice(0, 10);

const isHistoricalDate = (date: string | null) => Boolean(date && date < todayDate());

const safeLocalStorageGet = (key: string) => {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalStorageSet = (key: string, value: string) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures.
  }
};

const buildRateCacheKey = (base: string, date: string | null) =>
  `${RATE_CACHE_PREFIX}:${base}:${date ?? 'latest'}`;

const parseCacheEntry = (key: string) => {
  const rawValue = safeLocalStorageGet(key);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as RateCacheEntry;
    if (!parsed || typeof parsed !== 'object' || !parsed.rates) return null;
    return parsed;
  } catch {
    return null;
  }
};

const normalizeRequestedDate = (date?: string) => {
  if (!date) return null;

  const trimmed = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  if (trimmed >= todayDate()) return null;
  return trimmed;
};

const readCachedRateTable = (base: string, date: string | null) => {
  const entry = parseCacheEntry(buildRateCacheKey(base, date));
  if (!entry) return null;

  if (isHistoricalDate(date)) {
    return {
      entry,
      fresh: true,
    };
  }

  const ageMs = Date.now() - Date.parse(entry.fetchedAt);
  return {
    entry,
    fresh: Number.isFinite(ageMs) && ageMs <= LATEST_RATE_TTL_MS,
  };
};

const writeCachedRateTable = (entry: RateCacheEntry) => {
  safeLocalStorageSet(buildRateCacheKey(entry.base, entry.requestedDate), JSON.stringify(entry));
};

const fetchRateTable = async (base: string, date: string | null) => {
  const cached = readCachedRateTable(base, date);
  if (cached?.fresh) {
    return {
      entry: cached.entry,
      source: 'cache' as const,
      stale: false,
    };
  }

  const endpoint = date ? `${FRANKFURTER_API_ROOT}/${date}?from=${base}` : `${FRANKFURTER_API_ROOT}/latest?from=${base}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Frankfurter responded with ${response.status}`);
    }

    const payload = (await response.json()) as FrankfurterResponse;
    if (!payload?.rates || !payload?.date) {
      throw new Error('Frankfurter response is missing rate data');
    }

    const entry: RateCacheEntry = {
      base,
      requestedDate: date,
      effectiveDate: payload.date,
      fetchedAt: new Date().toISOString(),
      rates: payload.rates,
    };

    writeCachedRateTable(entry);

    return {
      entry,
      source: 'network' as const,
      stale: false,
    };
  } catch (error) {
    if (cached?.entry) {
      return {
        entry: cached.entry,
        source: 'cache' as const,
        stale: true,
      };
    }

    throw error;
  }
};

export const normalizeCurrencyCode = (currency?: string | null) => {
  const normalized = (currency ?? '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : '';
};

export const loadCurrencyPreference = (storageKey: string) => {
  const rawValue = safeLocalStorageGet(storageKey);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as CurrencyPreference;
    if (!parsed?.from || !parsed?.to) return null;
    return {
      from: normalizeCurrencyCode(parsed.from),
      to: normalizeCurrencyCode(parsed.to),
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
};

export const saveCurrencyPreference = (storageKey: string, preference: CurrencyPreference) => {
  safeLocalStorageSet(storageKey, JSON.stringify(preference));
};

export const formatCurrencyAmount = (
  amount: number,
  currency: string,
  options?: Intl.NumberFormatOptions,
) => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

export async function convertCurrency(params: {
  amount: number;
  from: string;
  to: string;
  date?: string;
}): Promise<CurrencyQuote> {
  const from = normalizeCurrencyCode(params.from);
  const to = normalizeCurrencyCode(params.to);

  if (!from || !to) {
    throw new Error('Selecciona códigos de moneda válidos');
  }

  if (!Number.isFinite(params.amount)) {
    throw new Error('Introduce una cantidad válida');
  }

  const amount = params.amount;
  const requestedDate = normalizeRequestedDate(params.date);

  if (from === to) {
    return {
      amount,
      convertedAmount: amount,
      from,
      to,
      rate: 1,
      date: requestedDate ?? todayDate(),
      fetchedAt: new Date().toISOString(),
      source: 'identity',
      stale: false,
    };
  }

  const { entry, source, stale } = await fetchRateTable(from, requestedDate);
  const rate = entry.rates[to];

  if (typeof rate !== 'number') {
    throw new Error(`No hay tipo de cambio disponible para ${from}/${to}`);
  }

  return {
    amount,
    convertedAmount: amount * rate,
    from,
    to,
    rate,
    date: entry.effectiveDate,
    fetchedAt: entry.fetchedAt,
    source,
    stale,
  };
}