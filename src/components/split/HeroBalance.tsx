import { TrendingUp, TrendingDown } from 'lucide-react';

interface Balance {
  member: { id: string; name: string };
  balance: number;
}

interface HeroBalanceProps {
  balances: Balance[];
  currentUserId: string;
}

export function HeroBalance({ balances, currentUserId }: HeroBalanceProps) {
  // Calcular el balance total del usuario actual
  const userBalance = balances.find(b => b.member.id === currentUserId);
  const totalBalance = userBalance?.balance ?? 0;
  
  // Calcular cuánto debe y cuánto le deben
  const youOwe = balances
    .filter(b => b.member.id === currentUserId && b.balance < 0)
    .reduce((sum, b) => sum + Math.abs(b.balance), 0);
  
  const owedToYou = balances
    .filter(b => b.member.id === currentUserId && b.balance > 0)
    .reduce((sum, b) => sum + b.balance, 0);

  const isPositive = totalBalance >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary-dark p-4 text-white shadow-xl backdrop-blur-sm md:p-8">
      {/* Background decoration */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      
      <div className="relative space-y-3 md:space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium opacity-90 md:text-lg">💸 Balance Total</span>
        </div>
        
        <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
          <span className="text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl">
            {totalBalance.toFixed(2)}
          </span>
          <span className="text-lg font-semibold opacity-80 sm:text-xl md:text-2xl">EUR</span>
          {totalBalance !== 0 && (
            <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-300' : 'text-red-300'}`}>
              {isPositive ? (
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
              ) : (
                <TrendingDown className="h-5 w-5 md:h-6 md:w-6" />
              )}
            </div>
          )}
        </div>

        <div className="grid gap-3 pt-3 md:grid-cols-2 md:pt-4">
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm md:p-4">
            <div className="text-xs font-medium opacity-80 md:text-sm">Debes</div>
            <div className="mt-1 text-xl font-bold text-red-300 md:text-2xl">
              {youOwe.toFixed(2)} EUR
            </div>
          </div>
          
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm md:p-4">
            <div className="text-xs font-medium opacity-80 md:text-sm">Te deben</div>
            <div className="mt-1 text-xl font-bold text-emerald-300 md:text-2xl">
              {owedToYou.toFixed(2)} EUR
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
