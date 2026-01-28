import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ProgressCardProps {
  totalItems: number;
  completedItems: number;
}

export function ProgressCard({ totalItems, completedItems }: ProgressCardProps) {
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const pendingItems = totalItems - completedItems;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Progreso Total
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-primary text-xl">{percentage}%</span>
            <span className="text-muted-foreground">
              {completedItems} de {totalItems} items
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
              <span className="text-lg">✓</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Completados</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">{completedItems}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20">
              <span className="text-lg">⚪</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Pendientes</span>
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{pendingItems}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
