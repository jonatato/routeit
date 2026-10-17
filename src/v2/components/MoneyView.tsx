import type { Ledger, Settlement } from '../ledger';

type MoneyViewProps = {
  ledger: Ledger;
  onSettle?: (settlement: Settlement) => void;
};

const format = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);

export function MoneyView({ ledger, onSettle }: MoneyViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <div>
        <p className="text-sm text-mutedForeground">Gastado en el viaje</p>
        <p className="text-3xl font-semibold tabular-nums">{format(ledger.total, ledger.currency)}</p>
      </div>
      <section className="grid gap-2">
        <h2 className="text-sm font-semibold">Gastos</h2>
        {ledger.expenses.length === 0 && <p className="text-sm text-mutedForeground">Todavía no hay costes en las actividades.</p>}
        <ul className="grid gap-2">
          {ledger.expenses.map(expense => (
            <li key={expense.id} className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-sm">
              <span>{expense.label}</span>
              <span className="tabular-nums">{format(expense.amount, expense.currency)}</span>
            </li>
          ))}
        </ul>
      </section>
      {ledger.balances.length > 1 && (
        <section className="grid gap-2">
          <h2 className="text-sm font-semibold">Saldo</h2>
          <ul className="grid gap-2 text-sm">
            {ledger.balances.map(entry => (
              <li key={entry.member.id} className="flex items-baseline justify-between">
                <span>{entry.member.name}</span>
                <span className={entry.balance < 0 ? 'text-danger' : 'text-success'}>
                  {format(entry.balance, ledger.currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {ledger.settlements.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold">Saldar</h2>
          {ledger.settlements.map(settlement => (
            <div key={`${settlement.fromId}-${settlement.toId}`} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3 text-sm">
              <p>{settlement.fromName} paga a {settlement.toName} {format(settlement.amount, ledger.currency)}</p>
              {onSettle && (
                <button type="button" onClick={() => onSettle(settlement)} className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primaryForeground">
                  Hecho
                </button>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
