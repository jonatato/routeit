import { BarChart3, Calendar, MapPin, Target, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { TravelItinerary } from '../../data/itinerary';

interface StatsWidgetProps {
  itinerary: TravelItinerary;
  totalSpent?: number;
  estimatedBudget?: number;
}

export function StatsWidget({ itinerary, totalSpent = 0, estimatedBudget = 2500 }: StatsWidgetProps) {
  // Calculate stats
  const duration = itinerary.days.length;
  const cities = itinerary.locations?.length || 0;
  const activities = itinerary.days.reduce((sum: number, day) => sum + day.schedule.length, 0);
  const restaurants = itinerary.days.reduce(
    (sum: number, day) => sum + day.schedule.filter((item) => item.activity.toLowerCase().includes('restaurante') || item.activity.toLowerCase().includes('comida')).length,
    0
  );
  
  // Calculate total distance (mock - would need proper calculation)
  const totalDistance = cities * 500;

  const budgetProgress = estimatedBudget > 0 ? Math.min((totalSpent / estimatedBudget) * 100, 100) : 0;
  const budgetColor = budgetProgress > 90 ? 'bg-red-500' : budgetProgress > 70 ? 'bg-orange-500' : 'bg-emerald-500';

  const stats = [
    {
      icon: <Calendar className="h-4 w-4" />,
      label: 'Duración',
      value: `${duration} ${duration === 1 ? 'día' : 'días'}`,
    },
    {
      icon: <MapPin className="h-4 w-4" />,
      label: 'Ciudades',
      value: cities.toString(),
    },
    {
      icon: <Target className="h-4 w-4" />,
      label: 'Actividades',
      value: activities.toString(),
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: 'Restaurantes',
      value: restaurants.toString(),
    },
  ];

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="text-lg">📊</span>
          Estadísticas del Viaje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                {stat.icon}
                {stat.label}
              </div>
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Distance */}
        {totalDistance > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Distancia total
            </div>
            <div className="text-xl font-bold text-foreground">
              {totalDistance.toLocaleString()} km
            </div>
          </div>
        )}

        {/* Budget Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">💰 Presupuesto</span>
            <span className="font-semibold text-foreground">{budgetProgress.toFixed(1)}%</span>
          </div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimado:</span>
            <span className="font-semibold text-foreground">{estimatedBudget.toFixed(2)} EUR</span>
          </div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Gastado:</span>
            <span className={`font-semibold ${budgetProgress > 90 ? 'text-red-600' : 'text-foreground'}`}>
              {totalSpent.toFixed(2)} EUR
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-300 ${budgetColor}`}
              style={{ width: `${budgetProgress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
