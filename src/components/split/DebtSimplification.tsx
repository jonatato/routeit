import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { SplitMember } from '../../services/split';
import { simplifyDebts } from '../../services/split';

type DebtSimplificationProps = {
  members: SplitMember[];
  balances: Array<{ member: SplitMember; balance: number }>;
};

export function DebtSimplification({ members, balances }: DebtSimplificationProps) {
  const simplified = simplifyDebts(balances);

  const getMemberName = (memberId: string) => {
    return members.find(m => m.id === memberId)?.name || 'Desconocido';
  };

  if (simplified.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deudas simplificadas</CardTitle>
          <CardDescription>No hay deudas pendientes</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deudas simplificadas</CardTitle>
        <CardDescription>Mínimo número de transacciones necesarias</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {simplified.map((debt, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span>
              <span className="font-medium">{getMemberName(debt.from)}</span> debe{' '}
              <span className="font-medium">{debt.amount.toFixed(2)}</span> a{' '}
              <span className="font-medium">{getMemberName(debt.to)}</span>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
