import { Lightbulb, DollarSign, Plug, Clock, Smartphone, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface TipItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}

interface UsefulTipsWidgetProps {
  country: string;
  currency: string;
  exchangeRate?: number;
  timezone: string;
  timezoneOffset: string;
  plugType: string;
  voltage: string;
}

export function UsefulTipsWidget({
  country,
  currency = 'CNY',
  exchangeRate = 7.85,
  timezone = 'UTC+8',
  timezoneOffset = '+6h respecto a España',
  plugType = 'A, I',
  voltage = '220V',
}: UsefulTipsWidgetProps) {
  const tips: TipItem[] = [
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: 'Moneda',
      value: `Yuan (${currency})`,
      subtext: `1 EUR = ${exchangeRate} ${currency}`,
    },
    {
      icon: <Plug className="h-4 w-4" />,
      label: 'Enchufe',
      value: `Tipo ${plugType}`,
      subtext: voltage,
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: 'Zona horaria',
      value: timezone,
      subtext: timezoneOffset,
    },
    {
      icon: <Smartphone className="h-4 w-4" />,
      label: 'SIM local',
      value: 'China Mobile',
      subtext: '~30 CNY (3.8€) / 7 días',
    },
    {
      icon: <Wifi className="h-4 w-4" />,
      label: 'WiFi',
      value: 'VPN recomendado',
      subtext: 'Great Firewall activo',
    },
  ];

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="text-lg">💡</span>
          Tips Útiles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tips.map((tip, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex-shrink-0 rounded-full bg-yellow-100 p-2 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                {tip.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">{tip.label}</div>
                <div className="font-medium text-foreground">{tip.value}</div>
                {tip.subtext && (
                  <div className="text-xs text-muted-foreground">{tip.subtext}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Extra Tip */}
        <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <span className="font-semibold">Tip:</span> Descarga la app WeChat antes de viajar,
              es esencial para pagos y comunicación en {country}.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
