import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Plus, Receipt } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface ExpenseUser {
  name: string;
  amount: number;
  avatar?: string;
}

interface ExpensesSidebarProps {
  expenses?: {
    total: number;
    byCity: { city: string; amount: number }[];
    byUser: ExpenseUser[];
    categories: { name: string; percentage: number; color: string }[];
  };
}

function ExpensesSidebar({ expenses }: ExpensesSidebarProps) {
  const [selectedCity, setSelectedCity] = useState('Berlin');

  // Mock data if not provided
  const defaultExpenses = {
    total: 540.0,
    byCity: [
      { city: 'Berlin', amount: 540.0 },
      { city: 'Praga', amount: 0 },
      { city: 'Viena', amount: 0 },
      { city: 'Budapest', amount: 0 },
    ],
    byUser: [
      { name: 'Jon', amount: 37.14 },
      { name: 'Julia', amount: 42.2 },
      { name: 'Jon', amount: 44.94 },
    ],
    categories: [
      { name: 'Alojamiento', percentage: 55, color: '#9b87f5' },
      { name: 'Comida', percentage: 20, color: '#fbbf24' },
      { name: 'Comida', percentage: 18, color: '#f472b6' },
      { name: 'Otros', percentage: 7, color: '#94a3b8' },
    ],
  };

  const data = expenses || defaultExpenses;

  return (
    <aside className="hidden xl:block w-80 shrink-0 p-4 space-y-4 overflow-y-auto max-h-screen">
      {/* Expenses Summary Card */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gastos</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              Baltar guía
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* City Selector */}
          <div className="flex flex-wrap gap-2">
            {data.byCity.map((city) => (
              <Button
                key={city.city}
                variant={selectedCity === city.city ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCity(city.city)}
                className="rounded-full"
              >
                {city.city}
              </Button>
            ))}
            <Button variant="outline" size="sm" className="rounded-full">
              Lista de empuje
            </Button>
          </div>

          {/* Mini Map Placeholder */}
          <div className="relative h-24 bg-muted rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <Badge variant="secondary" className="bg-primary/10">
                <MapPin className="h-3 w-3 mr-1" />
                19%
              </Badge>
            </div>
          </div>

          {/* City Info */}
          <div className="flex items-center gap-3">
            <div className="text-4xl">☁️</div>
            <div>
              <h3 className="text-lg font-semibold">{selectedCity}</h3>
              <p className="text-sm text-muted-foreground">€{data.byCity.find(c => c.city === selectedCity)?.amount.toFixed(2)}</p>
            </div>
            <Link to="/app/split" className="ml-auto">
              <Button size="sm" variant="outline">
                Añadir gasto
              </Button>
            </Link>
          </div>

          {/* Expenses by User */}
          <div className="flex gap-2 justify-between">
            {data.byUser.slice(0, 3).map((user, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {user.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold">€{user.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{user.name}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Breakdown Card */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Gastos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pie Chart Placeholder */}
          <div className="relative h-48 flex items-center justify-center">
            <div className="h-40 w-40 rounded-full border-8 border-primary/20 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold">55%</p>
                <p className="text-xs text-muted-foreground">Alojamiento</p>
              </div>
            </div>
          </div>

          {/* Expense Users List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10" />
                <span>Jon</span>
              </div>
              <span className="font-medium">70%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10" />
                <span>Sandra</span>
              </div>
              <span className="font-medium">€0.00</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10" />
                <span>Julia</span>
              </div>
              <span className="font-medium">€0.00</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10" />
                <span>Julia</span>
              </div>
              <span className="font-medium">€50.30</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Card */}
      <Card className="shadow-md">
        <CardContent className="p-2">
          <div className="h-48 bg-muted rounded-lg overflow-hidden">
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <MapPin className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

export default ExpensesSidebar;
