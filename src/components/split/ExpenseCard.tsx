import { Calendar, Users, MapPin, MoreVertical } from 'lucide-react';
import { Button } from '../ui/button';

interface SplitMember {
  id: string;
  name: string;
}

interface SplitExpense {
  id: string;
  title: string;
  amount: number;
  payer_id: string;
  expense_date?: string;
  category_id?: string;
  schedule_item_id?: string;
  currency?: string;
}

interface ExpenseCardProps {
  expense: SplitExpense;
  payer?: SplitMember;
  participantsCount: number;
  categoryIcon?: string;
  categoryColor?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const categoryIcons: Record<string, string> = {
  food: '🍜',
  transport: '🚕',
  lodging: '🏨',
  activity: '🎫',
  other: '📦',
};

const categoryColors: Record<string, string> = {
  food: '#f59e0b',
  transport: '#3b82f6',
  lodging: '#ec4899',
  activity: '#8b5cf6',
  other: '#6b7280',
};

export function ExpenseCard({
  expense,
  payer,
  participantsCount,
  categoryIcon,
  categoryColor,
  onClick,
}: ExpenseCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const icon = categoryIcon || categoryIcons.other;
  const color = categoryColor || categoryColors.other;

  return (
    <div
      className="group relative cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:scale-[1.02] hover:border-primary/30 hover:shadow-md"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Category Icon */}
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl"
            style={{ backgroundColor: `${color}20` }}
          >
            <span>{icon}</span>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {expense.title}
            </h3>
            
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {expense.amount.toFixed(2)} {expense.currency || 'EUR'}
              </span>
              <span>•</span>
              <span>Pagó: {payer?.name || 'Desconocido'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            // Show context menu
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {/* Participants */}
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>{participantsCount} {participantsCount === 1 ? 'persona' : 'personas'}</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(expense.expense_date)}</span>
        </div>

        {/* Linked to activity */}
        {expense.schedule_item_id && (
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
            <MapPin className="h-3 w-3" />
            <span className="font-medium">Actividad</span>
          </div>
        )}
      </div>
    </div>
  );
}
