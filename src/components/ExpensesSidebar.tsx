import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Plus, Receipt } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchSplit } from '../services/split';

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
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [realExpenses, setRealExpenses] = useState<{
    total: number;
    byCity: { city: string; amount: number }[];
    byUser: ExpenseUser[];
    categories: { name: string; percentage: number; color: string }[];
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's most recent itinerary (owned or collaborated)
        // First try owned itineraries
        let { data: ownedItinerary } = await supabase
          .from('itineraries')
          .select('id')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // If no owned itinerary, try collaborated itineraries
        let itinerary = ownedItinerary;
        if (!itinerary) {
          const { data: collaboratedItineraries } = await supabase
            .from('itinerary_collaborators')
            .select('itinerary_id, itineraries!inner(id, updated_at)')
            .eq('user_id', user.id)
            .order('itineraries.updated_at', { ascending: false, foreignTable: 'itineraries' })
            .limit(1)
            .maybeSingle();

          if (collaboratedItineraries) {
            itinerary = { id: collaboratedItineraries.itinerary_id };
          }
        }

        if (!itinerary) {
          setRealExpenses(null);
          setLoading(false);
          return;
        }

        // Fetch split groups for this itinerary
        const { data: groups, error: groupsError } = await supabase
          .from('split_groups')
          .select('*')
          .eq('itinerary_id', itinerary.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (groupsError) {
          console.error('Error fetching groups:', groupsError);
          setRealExpenses(null);
          setLoading(false);
          return;
        }

        if (!groups || groups.length === 0) {
          setRealExpenses(null);
          setLoading(false);
          return;
        }

        // Fetch expenses for the most recent group
        const splitData = await fetchSplit(groups[0].id);
        const allExpenses = splitData.expenses;
        
        if (allExpenses.length === 0) {
          setRealExpenses(null);
          setLoading(false);
          return;
        }

        // Calculate total
        const total = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Group by city (using tags or a custom field if available)
        const cityMap = new Map<string, number>();
        allExpenses.forEach(exp => {
          // For now, we'll use "General" as default city
          // You can modify this to use actual city data if available
          const city = 'General';
          cityMap.set(city, (cityMap.get(city) || 0) + exp.amount);
        });

        const byCity = Array.from(cityMap.entries()).map(([city, amount]) => ({
          city,
          amount,
        }));

        // Group by user (payer)
        const userMap = new Map<string, { name: string; amount: number }>();
        allExpenses.forEach(exp => {
          const payerMember = splitData.members.find(m => m.id === exp.payer_id);
          const userName = payerMember?.name || 'Usuario';
          if (userMap.has(exp.payer_id)) {
            userMap.get(exp.payer_id)!.amount += exp.amount;
          } else {
            userMap.set(exp.payer_id, { name: userName, amount: exp.amount });
          }
        });

        const byUser = Array.from(userMap.values());

        // Group by category
        const categoryMap = new Map<string, number>();
        allExpenses.forEach(exp => {
          const categoryData = splitData.categories.find(c => c.id === exp.category_id);
          const categoryName = categoryData?.name || 'Otros';
          categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + exp.amount);
        });

        const categories = Array.from(categoryMap.entries()).map(([name, amount], index) => {
          const colors = ['#9b87f5', '#fbbf24', '#f472b6', '#94a3b8', '#10b981', '#ef4444'];
          return {
            name,
            percentage: Math.round((amount / total) * 100),
            color: colors[index % colors.length],
          };
        });

        setRealExpenses({
          total,
          byCity,
          byUser,
          categories,
        });

        // Set default selected city
        if (byCity.length > 0) {
          setSelectedCity(byCity[0].city);
        }
      } catch (error) {
        console.error('Error loading expenses:', error);
        setRealExpenses(null);
      } finally {
        setLoading(false);
      }
    };

    loadExpenses();
  }, []);

  const data = expenses || realExpenses;

  if (loading) {
    return (
      <aside className="hidden xl:block w-80 shrink-0 p-4 space-y-4 overflow-y-auto max-h-screen">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Cargando gastos...</p>
          </CardContent>
        </Card>
      </aside>
    );
  }

  if (!data) {
    return (
      <aside className="hidden xl:block w-80 shrink-0 p-4 space-y-4 overflow-y-auto max-h-screen">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">No hay gastos registrados aún.</p>
            <Link to="/app/split">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Añadir primer gasto
              </Button>
            </Link>
          </CardContent>
        </Card>
      </aside>
    );
  }

  return (
    <aside className="hidden xl:block w-80 shrink-0 p-4 space-y-4 overflow-y-auto max-h-screen">
      {/* Expenses Summary Card */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gastos</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              Falta guía
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
              Lista de la compra
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
