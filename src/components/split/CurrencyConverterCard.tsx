import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightLeft, CalendarDays, Check, ChevronDown, Coins, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  GLOBAL_CURRENCY_PREFERENCE_KEY,
  POPULAR_CURRENCIES,
  convertCurrency,
  formatCurrencyAmount,
  loadCurrencyPreference,
  normalizeCurrencyCode,
  saveCurrencyPreference,
  type CurrencyQuote,
} from '../../services/currency';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface CurrencyConverterCardProps {
  defaultFromCurrency?: string;
  storageKey: string;
  className?: string;
}

const currencyFlags: Record<string, string> = {
  AUD: '🇦🇺',
  BRL: '🇧🇷',
  CAD: '🇨🇦',
  CHF: '🇨🇭',
  CNY: '🇨🇳',
  CZK: '🇨🇿',
  DKK: '🇩🇰',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  HKD: '🇭🇰',
  HUF: '🇭🇺',
  IDR: '🇮🇩',
  ILS: '🇮🇱',
  INR: '🇮🇳',
  ISK: '🇮🇸',
  JPY: '🇯🇵',
  KRW: '🇰🇷',
  MXN: '🇲🇽',
  MYR: '🇲🇾',
  NOK: '🇳🇴',
  NZD: '🇳🇿',
  PHP: '🇵🇭',
  PLN: '🇵🇱',
  RON: '🇷🇴',
  SEK: '🇸🇪',
  SGD: '🇸🇬',
  THB: '🇹🇭',
  TRY: '🇹🇷',
  USD: '🇺🇸',
  ZAR: '🇿🇦',
};

const currencyCountries: Record<string, string> = {
  AUD: 'au',
  BRL: 'br',
  CAD: 'ca',
  CHF: 'ch',
  CNY: 'cn',
  CZK: 'cz',
  DKK: 'dk',
  EUR: 'eu',
  GBP: 'gb',
  HKD: 'hk',
  HUF: 'hu',
  IDR: 'id',
  ILS: 'il',
  INR: 'in',
  ISK: 'is',
  JPY: 'jp',
  KRW: 'kr',
  MXN: 'mx',
  MYR: 'my',
  NOK: 'no',
  NZD: 'nz',
  PHP: 'ph',
  PLN: 'pl',
  RON: 'ro',
  SEK: 'se',
  SGD: 'sg',
  THB: 'th',
  TRY: 'tr',
  USD: 'us',
  ZAR: 'za',
};

const DEFAULT_AMOUNT = '100';

const fallbackTargetCurrency = (fromCurrency: string) => (fromCurrency === 'EUR' ? 'USD' : 'EUR');

const getCurrencyFlagUrl = (currency: string) => {
  const countryCode = currencyCountries[currency];
  if (!countryCode) return null;
  return `https://flagcdn.com/24x18/${countryCode}.png`;
};

function CurrencyOption({
  currency,
  isSelected = false,
}: {
  currency: string;
  isSelected?: boolean;
}) {
  const flagUrl = getCurrencyFlagUrl(currency);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-[18px] w-6 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-slate-200 bg-white">
        {flagUrl ? (
          <img
            src={flagUrl}
            alt={`Bandera ${currency}`}
            className="h-full w-full object-cover"
            loading="lazy"
            width={24}
            height={18}
          />
        ) : (
          <span className="text-xs leading-none">{currencyFlags[currency] ?? '🏳️'}</span>
        )}
      </div>
      <span className="font-medium text-foreground">{currency}</span>
      {isSelected && <Check className="ml-auto h-4 w-4 text-primary" />}
    </div>
  );
}

function CurrencySelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (currency: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className="relative space-y-2">
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(current => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <CurrencyOption currency={value} />
        <ChevronDown className={`ml-3 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_60px_rgba(15,23,42,0.14)]">
          <div role="listbox" aria-label={label} className="space-y-1">
            {POPULAR_CURRENCIES.map((currency) => (
              <button
                key={currency}
                type="button"
                onClick={() => {
                  onChange(currency);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  currency === value ? 'bg-primary/8 text-foreground' : 'hover:bg-slate-50'
                }`}
              >
                <CurrencyOption currency={currency} isSelected={currency === value} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CurrencyConverterCard({
  defaultFromCurrency = 'EUR',
  storageKey,
  className,
}: CurrencyConverterCardProps) {
  const normalizedDefaultFrom = normalizeCurrencyCode(defaultFromCurrency) || 'EUR';
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [fromCurrency, setFromCurrency] = useState(normalizedDefaultFrom);
  const [toCurrency, setToCurrency] = useState(fallbackTargetCurrency(normalizedDefaultFrom));
  const [conversionDate, setConversionDate] = useState('');
  const [quote, setQuote] = useState<CurrencyQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scopedPreference = loadCurrencyPreference(storageKey);
    const globalPreference = loadCurrencyPreference(GLOBAL_CURRENCY_PREFERENCE_KEY);
    const preference = scopedPreference ?? globalPreference;

    if (!preference?.from || !preference?.to) {
      setFromCurrency(normalizedDefaultFrom);
      setToCurrency(fallbackTargetCurrency(normalizedDefaultFrom));
      return;
    }

    setFromCurrency(preference.from || normalizedDefaultFrom);
    setToCurrency(preference.to || fallbackTargetCurrency(preference.from || normalizedDefaultFrom));
  }, [normalizedDefaultFrom, storageKey]);

  useEffect(() => {
    const preference = {
      from: fromCurrency,
      to: toCurrency,
      updatedAt: new Date().toISOString(),
    };

    saveCurrencyPreference(storageKey, preference);
    saveCurrencyPreference(GLOBAL_CURRENCY_PREFERENCE_KEY, preference);
  }, [fromCurrency, storageKey, toCurrency]);

  useEffect(() => {
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setQuote(null);
      setError(null);
      return;
    }

    let ignore = false;
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextQuote = await convertCurrency({
          amount: parsedAmount,
          from: fromCurrency,
          to: toCurrency,
          date: conversionDate || undefined,
        });

        if (!ignore) {
          setQuote(nextQuote);
        }
      } catch (nextError) {
        if (!ignore) {
          setQuote(null);
          setError(nextError instanceof Error ? nextError.message : 'No se pudo convertir la cantidad');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [amount, conversionDate, fromCurrency, toCurrency]);

  const helperLabel = useMemo(() => {
    if (!quote) return null;

    return new Date(quote.fetchedAt).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [quote]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <Card className={cn('border-primary/15 bg-white/90 shadow-sm', className)}>
      <CardHeader className="gap-3 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Coins className="h-4 w-4 text-primary" />
              Conversor de divisas
            </CardTitle>
            <CardDescription>
              Utilidad visual para comparar importes. No modifica gastos ni balances guardados.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {quote?.stale && (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                <WifiOff className="mr-1 h-3 w-3" />
                Cache sin refrescar
              </Badge>
            )}
            {quote && (
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                {quote.date === new Date().toISOString().slice(0, 10) ? 'Cambio actual' : `Cambio ${quote.date}`}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-2">
            <label htmlFor="split-currency-amount" className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Cantidad
            </label>
            <input
              id="split-currency-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-semibold shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="split-currency-date" className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Fecha opcional
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="split-currency-date"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={conversionDate}
                onChange={(event) => setConversionDate(event.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <CurrencySelect id="split-currency-from" label="Desde" value={fromCurrency} onChange={setFromCurrency} />

          <Button
            type="button"
            variant="outline"
            onClick={handleSwapCurrencies}
            className="h-11 rounded-full border-slate-200 px-3"
            aria-label="Intercambiar monedas"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>

          <CurrencySelect id="split-currency-to" label="A" value={toCurrency} onChange={setToCurrency} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Resultado
              </div>
              <div className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {quote ? formatCurrencyAmount(quote.convertedAmount, quote.to) : '--'}
              </div>
              {quote && (
                <div className="text-sm text-muted-foreground">
                  1 {quote.from} = {quote.rate.toFixed(4)} {quote.to}
                </div>
              )}
            </div>

            <div className="text-right text-xs text-muted-foreground">
              {isLoading ? 'Actualizando cambio...' : helperLabel ? `Actualizado ${helperLabel}` : 'Selecciona cantidad y monedas'}
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}