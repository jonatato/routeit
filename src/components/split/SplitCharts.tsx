import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { SplitExpense, SplitCategory } from '../../services/split';

type SplitChartsProps = {
  expenses: SplitExpense[];
  categories: SplitCategory[];
};

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export function SplitCharts({ expenses, categories }: SplitChartsProps) {
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, { name: string; total: number }>();
    
    expenses.forEach(expense => {
      const category = categories.find(c => c.id === expense.category_id);
      const categoryName = category?.name || 'Sin categoría';
      const current = categoryMap.get(categoryName) || { name: categoryName, total: 0 };
      current.total += expense.amount;
      categoryMap.set(categoryName, current);
    });

    return Array.from(categoryMap.values());
  }, [expenses, categories]);

  const monthlyData = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      if (expense.expense_date) {
        const date = new Date(expense.expense_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = monthlyMap.get(monthKey) || 0;
        monthlyMap.set(monthKey, current + expense.amount);
      }
    });

    return Array.from(monthlyMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [expenses]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Gastos por categoría</CardTitle>
          <CardDescription>Distribución de gastos según categorías</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: unknown) => (typeof value === 'number' ? `€${value.toFixed(2)}` : '')} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos por mes</CardTitle>
          <CardDescription>Evolución de gastos mensuales</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: unknown) => (typeof value === 'number' ? `€${value.toFixed(2)}` : '')} />
              <Legend />
              <Bar dataKey="total" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
