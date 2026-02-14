import { Phone, AlertTriangle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface EmergencyContact {
  label: string;
  number: string;
  icon: string;
}

interface EmergencyWidgetProps {
  country: string;
  embassyPhone?: string;
  embassyAddress?: string;
  insurancePhone?: string;
  insurancePolicy?: string;
}

export function EmergencyWidget({
  country = 'China',
  embassyPhone = '+86 10 6532 3629',
  embassyAddress = 'Sanlitun, Chaoyang, Beijing',
  insurancePhone = '+34 900 123 456',
  insurancePolicy = 'TS-2026-12345',
}: EmergencyWidgetProps) {
  const localEmergencies: EmergencyContact[] = [
    { label: 'Policía', number: '110', icon: '🚓' },
    { label: 'Ambulancia', number: '120', icon: '🚑' },
    { label: 'Bomberos', number: '119', icon: '🚒' },
  ];

  const handleCall = (number: string) => {
    window.open(`tel:${number}`, '_self');
  };

  return (
    <Card className="border-red-200 transition-all hover:shadow-md dark:border-red-900/30">
      <CardHeader className="bg-red-50 pb-3 dark:bg-red-950/20">
        <CardTitle className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
          <span className="text-lg">🚨</span>
          Números de Emergencia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Local Emergencies */}
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Emergencias locales ({country})
          </div>
          <div className="space-y-2">
            {localEmergencies.map((contact, idx) => (
              <button
                key={idx}
                onClick={() => handleCall(contact.number)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 transition-all hover:border-red-300 hover:bg-red-50 dark:hover:border-red-900/50 dark:hover:bg-red-950/20"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{contact.icon}</span>
                  <div className="text-left">
                    <div className="font-medium text-foreground">{contact.label}</div>
                    <div className="text-sm text-muted-foreground">{contact.number}</div>
                  </div>
                </div>
                <Phone className="h-4 w-4 text-red-600 dark:text-red-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Embassy */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-400">
            <AlertTriangle className="h-4 w-4" />
            Embajada España en {country}
          </div>
          <button
            onClick={() => handleCall(embassyPhone)}
            className="mb-1 flex items-center gap-2 font-medium text-blue-900 transition-colors hover:underline dark:text-blue-300"
          >
            <Phone className="h-4 w-4" />
            {embassyPhone}
          </button>
          <div className="text-xs text-blue-700 dark:text-blue-400">
            📍 {embassyAddress}
          </div>
        </div>

        {/* Insurance */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Shield className="h-4 w-4" />
            Seguro de viaje
          </div>
          <button
            onClick={() => handleCall(insurancePhone)}
            className="mb-1 flex items-center gap-2 font-medium text-emerald-900 transition-colors hover:underline dark:text-emerald-300"
          >
            <Phone className="h-4 w-4" />
            {insurancePhone}
          </button>
          <div className="text-xs text-emerald-700 dark:text-emerald-400">
            Póliza: {insurancePolicy}
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div className="text-xs text-yellow-700 dark:text-yellow-400">
              <span className="font-semibold">Importante:</span> Guarda una copia de estos números
              offline. En caso de emergencia, contacta primero con servicios locales.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
