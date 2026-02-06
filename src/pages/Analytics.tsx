import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { getEventCount, getEventsByDateRange } from '../services/analytics';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    itineraryCreated: 0,
    itineraryUpdated: 0,
    expenseAdded: 0,
    paymentAdded: 0,
    pdfExported: 0,
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserId(user.id);

      // Load stats
      const [itineraryCreated, itineraryUpdated, expenseAdded, paymentAdded, pdfExported] = await Promise.all([
        getEventCount('itinerary_created', user.id),
        getEventCount('itinerary_updated', user.id),
        getEventCount('expense_added', user.id),
        getEventCount('payment_added', user.id),
        getEventCount('pdf_exported', user.id),
      ]);

      setStats({
        itineraryCreated,
        itineraryUpdated,
        expenseAdded,
        paymentAdded,
        pdfExported,
      });

      // Load recent events (last 30 days)
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const events = await getEventsByDateRange(user.id, startDate, endDate);
      setRecentEvents(events.slice(0, 20));

      // Prepare chart data (events by day)
      const eventsByDay = new Map<string, number>();
      events.forEach(event => {
        const day = new Date(event.created_at).toISOString().split('T')[0];
        eventsByDay.set(day, (eventsByDay.get(day) || 0) + 1);
      });
      setChartData(
        Array.from(eventsByDay.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      );

      setIsLoading(false);
    };
    void load();
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-center">
        <div className="space-y-3">
          <div className="text-6xl">📊</div>
          <p className="text-sm text-mutedForeground">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto flex w-full  items-center justify-center px-4 py-10">
        <p className="text-mutedForeground">No hay sesión activa</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full  flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          Analytics
        </h1>
        <p className="text-sm text-mutedForeground">Estadísticas de uso y actividad</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Itinerarios creados</CardDescription>
            <CardTitle className="text-2xl">{stats.itineraryCreated}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Itinerarios actualizados</CardDescription>
            <CardTitle className="text-2xl">{stats.itineraryUpdated}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gastos añadidos</CardDescription>
            <CardTitle className="text-2xl">{stats.expenseAdded}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pagos registrados</CardDescription>
            <CardTitle className="text-2xl">{stats.paymentAdded}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>PDFs exportados</CardDescription>
            <CardTitle className="text-2xl">{stats.pdfExported}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad (últimos 30 días)</CardTitle>
          <CardDescription>Eventos por día</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos recientes</CardTitle>
          <CardDescription>Últimas 20 actividades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentEvents.length === 0 ? (
              <p className="py-8 text-center text-mutedForeground">No hay eventos recientes</p>
            ) : (
              recentEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{event.event_type}</span>
                    {event.event_data && Object.keys(event.event_data).length > 0 && (
                      <span className="ml-2 text-mutedForeground">
                        {JSON.stringify(event.event_data)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-mutedForeground">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

