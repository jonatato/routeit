import { ArrowUp, ArrowDown, Check, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

interface SplitMember {
  id: string;
  name: string;
}

interface Balance {
  member: SplitMember;
  balance: number;
}

interface BalanceCardProps {
  balance: Balance;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BalanceCard({ balance, onEdit, onDelete }: BalanceCardProps) {
  const { member, balance: amount } = balance;
  const isPositive = amount > 0;
  const isZero = Math.abs(amount) < 0.01;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:bg-primary/5 md:p-4">
      <div className="flex items-center gap-2 min-w-0 flex-1 md:gap-3">
        {/* Avatar */}
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white md:h-12 md:w-12 ${
            isZero
              ? 'bg-gray-400'
              : isPositive
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
              : 'bg-gradient-to-br from-red-400 to-red-600'
          }`}
        >
          {getInitials(member.name)}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground truncate text-sm md:text-base">{member.name}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground md:text-sm">
            {isZero ? (
              <>
                <Check className="h-3 w-3 text-emerald-600 md:h-3.5 md:w-3.5" />
                <span className="text-emerald-600">Equilibrado</span>
              </>
            ) : isPositive ? (
              <>
                <ArrowUp className="h-3 w-3 text-emerald-600 md:h-3.5 md:w-3.5" />
                <span>Le deben</span>
              </>
            ) : (
              <>
                <ArrowDown className="h-3 w-3 text-red-500 md:h-3.5 md:w-3.5" />
                <span>Debe</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          <div
            className={`text-base font-bold md:text-xl ${
              isZero
                ? 'text-gray-600'
                : isPositive
                ? 'text-emerald-600'
                : 'text-red-500'
            }`}
          >
            {isPositive && '+'}
            {amount.toFixed(2)}
          </div>
          <div className="text-[10px] text-muted-foreground md:text-xs">EUR</div>
        </div>

        {/* Actions - Icons only on mobile */}
        {(onEdit || onDelete) && (
          <div className="flex gap-0.5 md:gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="h-7 w-7 p-0 md:h-8 md:w-auto md:px-3"
                title="Editar"
              >
                <Edit2 className="h-3.5 w-3.5 md:mr-2" />
                <span className="hidden md:inline text-xs">Editar</span>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive md:h-8 md:w-auto md:px-3"
                title="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5 md:mr-2" />
                <span className="hidden md:inline text-xs">Eliminar</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
