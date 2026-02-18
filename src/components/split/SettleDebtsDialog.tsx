import { useState } from 'react';
import { CreditCard, X, Check, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/useToast';

interface SplitMember {
  id: string;
  name: string;
}

interface Balance {
  member: SplitMember;
  balance: number;
}

interface SettleDebtsDialogProps {
  currentUserId: string;
  balances: Balance[];
  onSettle: (fromId: string, toId: string, amount: number) => Promise<void>;
}

export function SettleDebtsDialog({ currentUserId, balances, onSettle }: SettleDebtsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settlingWith, setSettlingWith] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState<{ memberId: string; amount: string } | null>(null);
  const { toast } = useToast();

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // People I owe money to (positive balances, excluding me)
  const creditors = balances
    .filter(b => b.member.id !== currentUserId && b.balance > 0.01)
    .sort((a, b) => b.balance - a.balance);

  // People who owe me money (negative balances, excluding me)
  const debtors = balances
    .filter(b => b.member.id !== currentUserId && b.balance < -0.01)
    .sort((a, b) => a.balance - b.balance);

  // Handle settle full debt
  const handleSettleFull = async (creditor: Balance) => {
    setSettlingWith(creditor.member.id);
    try {
      // I pay them the full amount they're owed
      await onSettle(currentUserId, creditor.member.id, creditor.balance);
      toast.success(`✅ Deuda liquidada con ${creditor.member.name}`);
      
      // Close dialog if no more debts
      if (creditors.length === 1) {
        setTimeout(() => setIsOpen(false), 500);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al liquidar deuda');
    } finally {
      setSettlingWith(null);
    }
  };

  // Handle partial payment
  const handlePartialPayment = async (creditor: Balance) => {
    if (!partialAmount || partialAmount.memberId !== creditor.member.id) return;

    const amount = parseFloat(partialAmount.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Cantidad inválida');
      return;
    }

    if (amount > creditor.balance) {
      toast.error(`No puedes pagar más de ${creditor.balance.toFixed(2)}€`);
      return;
    }

    setSettlingWith(creditor.member.id);
    try {
      await onSettle(currentUserId, creditor.member.id, amount);
      toast.success(`✅ Pagados ${amount.toFixed(2)}€ a ${creditor.member.name}`);
      setPartialAmount(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar pago');
    } finally {
      setSettlingWith(null);
    }
  };

  // Handle mark as received
  const handleMarkReceived = async (debtor: Balance) => {
    setSettlingWith(debtor.member.id);
    try {
      // They pay me the full amount they owe
      await onSettle(debtor.member.id, currentUserId, Math.abs(debtor.balance));
      toast.success(`✅ Pago recibido de ${debtor.member.name}`);
      
      // Close dialog if no more debts to receive
      if (debtors.length === 1 && creditors.length === 0) {
        setTimeout(() => setIsOpen(false), 500);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar pago');
    } finally {
      setSettlingWith(null);
    }
  };

  // Check if there are any debts
  const hasDebts = creditors.length > 0 || debtors.length > 0;

  return (
    <>
      {/* Main Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-xl bg-gradient-to-r from-primary/95 to-primary py-6 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
      >
        <CreditCard className="mr-2 h-5 w-5" />
        Liquidar Deudas
      </Button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setIsOpen(false);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Cerrar modal"
          />

          {/* Modal Content */}
          <div className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="border-b border-border bg-muted/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Liquidar Deuda
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {hasDebts ? 'Selecciona cómo quieres liquidar' : 'No tienes deudas pendientes'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="space-y-6">
                {/* No debts message */}
                {!hasDebts && (
                  <div className="rounded-xl bg-emerald-50 p-8 text-center dark:bg-emerald-900/20">
                    <div className="mb-3 text-4xl">✅</div>
                    <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                      ¡No tienes deudas!
                    </div>
                    <div className="mt-1 text-sm text-emerald-600 dark:text-emerald-500">
                      Tu balance está equilibrado
                    </div>
                  </div>
                )}

                {/* People I owe money to */}
                {creditors.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">
                      💰 Personas a las que les debes:
                    </h3>
                    <div className="space-y-3">
                      {creditors.map(creditor => (
                        <div
                          key={creditor.member.id}
                          className="rounded-xl border border-border bg-gradient-to-br from-red-50 to-red-100/50 p-4 dark:from-red-950/20 dark:to-red-900/10"
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Avatar & Info */}
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 text-sm font-semibold text-white">
                                {getInitials(creditor.member.name)}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{creditor.member.name}</div>
                                <div className="text-sm text-red-600 dark:text-red-400">
                                  Debes: {creditor.balance.toFixed(2)}€
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Button
                                onClick={() => handleSettleFull(creditor)}
                                disabled={settlingWith !== null}
                                size="sm"
                                className="bg-primary text-white hover:bg-primary/90"
                              >
                                {settlingWith === creditor.member.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Liquidando...
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Liquidar todo
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={() =>
                                  setPartialAmount(
                                    partialAmount?.memberId === creditor.member.id
                                      ? null
                                      : { memberId: creditor.member.id, amount: '' },
                                  )
                                }
                                disabled={settlingWith !== null}
                                size="sm"
                                variant="outline"
                              >
                                Parcial...
                              </Button>
                            </div>
                          </div>

                          {/* Partial payment input */}
                          {partialAmount?.memberId === creditor.member.id && (
                            <div className="mt-3 flex items-center gap-2 rounded-lg bg-background/80 p-3">
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={creditor.balance}
                                value={partialAmount.amount}
                                onChange={e =>
                                  setPartialAmount({ ...partialAmount, amount: e.target.value })
                                }
                                placeholder="Cantidad"
                                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              <span className="text-sm text-muted-foreground">EUR</span>
                              <Button
                                onClick={() => handlePartialPayment(creditor)}
                                disabled={settlingWith !== null}
                                size="sm"
                              >
                                Registrar
                              </Button>
                              <Button
                                onClick={() => setPartialAmount(null)}
                                size="sm"
                                variant="ghost"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* People who owe me money */}
                {debtors.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">
                      📥 Personas que te deben:
                    </h3>
                    <div className="space-y-3">
                      {debtors.map(debtor => (
                        <div
                          key={debtor.member.id}
                          className="rounded-xl border border-border bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 dark:from-emerald-950/20 dark:to-emerald-900/10"
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Avatar & Info */}
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-semibold text-white">
                                {getInitials(debtor.member.name)}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{debtor.member.name}</div>
                                <div className="text-sm text-emerald-600 dark:text-emerald-400">
                                  Te debe: {Math.abs(debtor.balance).toFixed(2)}€
                                </div>
                              </div>
                            </div>

                            {/* Action */}
                            <Button
                              onClick={() => handleMarkReceived(debtor)}
                              disabled={settlingWith !== null}
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              {settlingWith === debtor.member.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Registrando...
                                </>
                              ) : (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Recibido
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
