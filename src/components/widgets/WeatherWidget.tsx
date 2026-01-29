import { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface WeatherDay {
  day: string;
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  icon: string;
}

interface WeatherWidgetProps {
  city: string;
  countryCode?: string;
}

export function WeatherWidget({ city, countryCode = 'CN' }: WeatherWidgetProps) {
  const [forecast, setForecast] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [bestSeason, setBestSeason] = useState('Primavera / Otoño');

  useEffect(() => {
    loadWeather();
  }, [city]);

  const loadWeather = async () => {
    try {
      setLoading(true);

      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;

      if (apiKey) {
        // Use OpenWeather 5-day forecast (3h intervals) and map to our simple 5-day model
        try {
          const resp = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)},${encodeURIComponent(countryCode)}&appid=${apiKey}&units=metric&lang=es`
          );

          if (!resp.ok) throw new Error(`Weather API error ${resp.status}`);

          const data = await resp.json();

          // Group forecast by day (local time)
          const daysMap: Record<string, { temps: number[]; conditions: string[] }> = {};

          (data.list || []).forEach((entry: any) => {
            const d = new Date((entry.dt || 0) * 1000);
            const key = d.toLocaleDateString('es-ES', { weekday: 'short' });
            daysMap[key] = daysMap[key] || { temps: [], conditions: [] };
            daysMap[key].temps.push(Math.round(entry.main.temp));
            daysMap[key].conditions.push(entry.weather?.[0]?.main || 'Sunny');
          });

          const mapped = Object.keys(daysMap).slice(0, 5).map((dayKey: string) => {
            const d = daysMap[dayKey];
            const avgTemp = Math.round(d.temps.reduce((a, b) => a + b, 0) / d.temps.length);
            const mainCond = d.conditions[0]?.toLowerCase() || 'sunny';
            const cond: WeatherDay['condition'] = mainCond.includes('rain') ? 'rainy' : mainCond.includes('snow') ? 'snowy' : mainCond.includes('cloud') || mainCond.includes('clouds') ? 'cloudy' : 'sunny';
            const icon = cond === 'sunny' ? '☀️' : cond === 'cloudy' ? '☁️' : cond === 'rainy' ? '🌧️' : '❄️';
            return { day: dayKey, temp: avgTemp, condition: cond, icon } as WeatherDay;
          });

          if (mapped.length > 0) {
            setForecast(mapped);
            setCurrentTemp(mapped[0].temp);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('OpenWeather API failed, falling back to mock', e);
        }
      }

      // Fallback: Mock data for demonstration
      const mockForecast: WeatherDay[] = [
        { day: 'Lun', temp: 28, condition: 'sunny', icon: '☀️' },
        { day: 'Mar', temp: 26, condition: 'cloudy', icon: '⛅' },
        { day: 'Mié', temp: 22, condition: 'rainy', icon: '🌧️' },
        { day: 'Jue', temp: 24, condition: 'cloudy', icon: '☁️' },
        { day: 'Vie', temp: 27, condition: 'sunny', icon: '☀️' },
      ];

      setForecast(mockForecast);
      setCurrentTemp(mockForecast[0].temp);

    } catch (error) {
      console.error('Error loading weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="h-5 w-5 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="h-5 w-5 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="h-5 w-5 text-blue-500" />;
      case 'snowy':
        return <CloudSnow className="h-5 w-5 text-blue-300" />;
      default:
        return <Sun className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 w-32 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-12 w-full rounded bg-muted" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 flex-1 rounded bg-muted" />
              ))}
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
          <span className="text-lg">🌤️</span>
          Clima
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location */}
        <div className="text-center">
          <div className="text-sm font-medium text-foreground">{city}</div>
          {currentTemp !== null && (
            <div className="mt-1 text-3xl font-bold text-primary">
              {currentTemp}°
            </div>
          )}
        </div>

        {/* 5-Day Forecast */}
        <div className="grid grid-cols-5 gap-2">
          {forecast.map((day, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-muted/30 p-2 text-center transition-colors hover:bg-muted/50"
            >
              <div className="text-xs font-medium text-muted-foreground">
                {day.day}
              </div>
              <div className="my-2 flex justify-center text-2xl">
                {day.icon}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {day.temp}°
              </div>
            </div>
          ))}
        </div>

        {/* Best Season */}
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Mejor época para visitar
              </div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {bestSeason}
              </div>
            </div>
          </div>
        </div>

        {/* Weather Tips */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>💧</span>
            <span>Probabilidad de lluvia: 30%</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🌡️</span>
            <span>Sensación térmica: {currentTemp ? currentTemp + 2 : '--'}°</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
