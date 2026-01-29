import { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import { ensureSplitGroup, fetchSplit, computeBalances, fetchPayments } from '../../services/split';

interface ExpenseSummaryWidgetProps {
  itineraryId: string;
  currentUserId: string;
}

export function ExpenseSummaryWidget({ itineraryId, currentUserId }: ExpenseSummaryWidgetProps) {
  const [totalSpent, setTotalSpent] = useState(0);
  const [myBalance, setMyBalance] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [theyOweYou, setTheyOweYou] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadExpenseSummary();
  }, [itineraryId, currentUserId]);

  const loadExpenseSummary = async () => {
    try {
      setLoading(true);
      
      // Ensure split group exists (creates if doesn't exist)
      const group = await ensureSplitGroup(itineraryId);
      
      // Fetch all split data
      const splitData = await fetchSplit(group.id);
      const payments = await fetchPayments(group.id);
      
      // Calculate balances
      const balances = computeBalances(
        splitData.members,
        splitData.expenses,
        splitData.shares,
        payments
      );
      
      // Find current user's balance
      const myBalanceData = balances.find(b => b.member.id === currentUserId);
      
      if (myBalanceData) {
        setMyBalance(myBalanceData.balance);
      }

      // Calculate totals
      const owe = balances
        .filter(b => b.member.id === currentUserId && b.balance < 0)
        .reduce((sum, b) => sum + Math.abs(b.balance), 0);
      
      const owed = balances
        .filter(b => b.member.id !== currentUserId && b.balance < 0)
        .reduce((sum, b) => sum + Math.abs(b.balance), 0);

      setYouOwe(owe);
      setTheyOweYou(owed);

      // Calculate total spent from expenses
      const total = splitData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      setTotalSpent(total);

    } catch (error) {
      console.error('Error loading expense summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    navigate('/app/split');
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 w-32 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 w-full rounded bg-muted" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 rounded bg-muted" />
              <div className="h-16 rounded bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="text-lg">💰</span>
          Resumen de Gastos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Spent */}
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Total Gastado</div>
          <div className="text-2xl font-bold text-foreground">
            {totalSpent.toFixed(2)} <span className="text-base font-normal">EUR</span>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* You Owe */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-950/20">
            <div className="mb-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <TrendingDown className="h-3 w-3" />
              Debes
            </div>
            <div className="text-lg font-bold text-red-700 dark:text-red-300">
              {youOwe.toFixed(2)}
            </div>
            <div className="text-xs text-red-600/70 dark:text-red-400/70">EUR</div>
          </div>

          {/* They Owe You */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
            <div className="mb-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              Te deben
            </div>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {theyOweYou.toFixed(2)}
            </div>
            <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">EUR</div>
          </div>
        </div>

        {/* My Balance */}
        {myBalance !== 0 && (
          <div className={`rounded-lg border p-3 text-center ${
            myBalance > 0 
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20' 
              : 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20'
          }`}>
            <div className="text-xs text-muted-foreground">Tu Balance</div>
            <div className={`text-xl font-bold ${
              myBalance > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {myBalance > 0 ? '+' : ''}{myBalance.toFixed(2)} EUR
            </div>
          </div>
        )}

        {/* View Details Button */}
        <button
          onClick={handleViewDetails}
          className="flex w-full items-center justify-center gap-1 text-sm text-primary transition-colors hover:underline"
        >
          Ver Detalles
          <ArrowRight className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
