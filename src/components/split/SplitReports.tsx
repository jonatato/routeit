import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { SplitExpense, SplitMember, SplitCategory, SplitPayment } from '../../services/split';
import { exportSplitReportToPDF } from '../../services/splitReports';
import { useToast } from '../../hooks/useToast';

type SplitReportsProps = {
  expenses: SplitExpense[];
  members: SplitMember[];
  categories: SplitCategory[];
  payments?: SplitPayment[];
  groupName?: string;
};

export function SplitReports({ expenses, members, categories, payments = [], groupName = 'Grupo' }: SplitReportsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const stats = useMemo(() => {
    const totalByMember = new Map<string, number>();
    const totalByCategory = new Map<string, number>();
    let totalExpenses = 0;
    let expenseCount = 0;

    expenses.forEach(expense => {
      const amount = Number(expense.amount);
      totalExpenses += amount;
      expenseCount++;

      const payer = members.find(m => m.id === expense.payer_id);
      if (payer) {
        totalByMember.set(payer.id, (totalByMember.get(payer.id) || 0) + amount);
      }

      if (expense.category_id) {
        const category = categories.find(c => c.id === expense.category_id);
        if (category) {
          totalByCategory.set(category.name, (totalByCategory.get(category.name) || 0) + amount);
        }
      }
    });

    const avgPerExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    return {
      totalExpenses,
      expenseCount,
      avgPerExpense,
      totalByMember: Array.from(totalByMember.entries())
        .map(([memberId, total]) => ({
          member: members.find(m => m.id === memberId),
          total,
        }))
        .filter(item => item.member)
        .sort((a, b) => b.total - a.total),
      totalByCategory: Array.from(totalByCategory.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total),
    };
  }, [expenses, members, categories]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportSplitReportToPDF(expenses, members, payments, categories, groupName);
      toast.success('PDF exportado correctamente');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExportPDF} disabled={isExporting} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar PDF'}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Resumen General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Total gastado</label>
            <p className="text-2xl font-bold">{stats.totalExpenses.toFixed(2)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Número de gastos</label>
            <p className="text-2xl font-bold">{stats.expenseCount}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Promedio por gasto</label>
            <p className="text-2xl font-bold">{stats.avgPerExpense.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos por Miembro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.totalByMember.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No hay datos</p>
          ) : (
            stats.totalByMember.map(({ member, total }) => (
              <div key={member?.id} className="flex items-center justify-between rounded border border-border px-3 py-2">
                <span className="text-sm">{member?.name}</span>
                <span className="font-semibold">{total.toFixed(2)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Gastos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.totalByCategory.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No hay datos</p>
          ) : (
            <div className="space-y-2">
              {stats.totalByCategory.map(({ name, total }) => {
                const percentage = stats.totalExpenses > 0 ? (total / stats.totalExpenses) * 100 : 0;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{name}</span>
                      <span className="font-semibold">
                        {total.toFixed(2)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
