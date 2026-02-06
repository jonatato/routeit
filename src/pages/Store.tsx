import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';

type StoreItineraryPreview = {
  id: string;
  title: string;
  coverImage: string;
  summary: string;
  price: number;
  days: number;
  cities: number;
  region: string;
  tags: string[];
  highlights: string[];
};

const STORE_ITINERARIES: StoreItineraryPreview[] = [
  {
    id: 'tokyo-classic-5d',
    title: 'Tokio clásico en 5 días',
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1600&auto=format&fit=crop',
    summary: 'Ruta compacta con barrios clave, transporte optimizado y horarios realistas.',
    price: 19,
    days: 5,
    cities: 1,
    region: 'Japón',
    tags: ['Cultura', 'Gastronomía', 'Urbano'],
    highlights: ['Shibuya y Shinjuku', 'Templos esenciales', 'Mapa de traslados optimizado'],
  },
  {
    id: 'italy-8d',
    title: 'Italia esencial 8 días',
    coverImage: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1600&auto=format&fit=crop',
    summary: 'Roma, Florencia y Venecia con tiempos equilibrados y tips de ahorro.',
    price: 29,
    days: 8,
    cities: 3,
    region: 'Italia',
    tags: ['Historia', 'Arte', 'Clásicos'],
    highlights: ['Itinerario balanceado', 'Checklists por ciudad', 'Sugerencias de pase diario'],
  },
  {
    id: 'mexico-6d',
    title: 'México CDMX + Teotihuacán',
    coverImage: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?q=80&w=1600&auto=format&fit=crop',
    summary: 'Ruta urbana con gastronomía local y excursión histórica incluida.',
    price: 15,
    days: 6,
    cities: 1,
    region: 'México',
    tags: ['Gastronomía', 'Historia', 'Local'],
    highlights: ['Itinerario por zonas', 'Food spots recomendados', 'Tiempo libre planificado'],
  },
  {
    id: 'thailand-10d',
    title: 'Tailandia play + cultura',
    coverImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=1600&auto=format&fit=crop',
    summary: 'Bangkok, Chiang Mai y playas con transiciones eficientes.',
    price: 35,
    days: 10,
    cities: 3,
    region: 'Tailandia',
    tags: ['Playas', 'Templos', 'Aventura'],
    highlights: ['Rutas de vuelo internas', 'Guía de mercados nocturnos', 'Plan día por día resumido'],
  },
];

function Store() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(Boolean(data.user));
    };
    void loadUser();
  }, []);

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    STORE_ITINERARIES.forEach(item => item.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet);
  }, []);

  const filtered = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return STORE_ITINERARIES.filter(item => {
      const matchesQuery =
        !normalized ||
        item.title.toLowerCase().includes(normalized) ||
        item.summary.toLowerCase().includes(normalized) ||
        item.region.toLowerCase().includes(normalized);
      const matchesTag = !activeTag || item.tags.includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [activeTag, searchQuery]);

  const handlePurchase = (title: string) => {
    toast.error(`Compra de "${title}" disponible próximamente.`);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold md:text-4xl">Tienda de itinerarios</h1>
        <p className="text-sm text-mutedForeground md:text-base">
          Explora itinerarios listos para usar. Vista previa sin detalles; desbloquea el contenido completo al comprar.
        </p>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Buscar por destino o estilo"
            className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label="Buscar itinerarios"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTag ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => setActiveTag(null)}
          >
            Todos
          </Button>
          {tags.map(tag => (
            <Button
              key={tag}
              variant={activeTag === tag ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map(item => {
          const isExpanded = expandedId === item.id;
          return (
            <Card key={item.id} className="overflow-hidden">
              <div className="h-48 w-full overflow-hidden">
                <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
              </div>
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{item.region}</Badge>
                  <Badge variant="outline">{item.days} días</Badge>
                  <Badge variant="outline">{item.cities} ciudad{item.cities > 1 ? 'es' : ''}</Badge>
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription>{item.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-mutedForeground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {isExpanded && (
                  <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-mutedForeground">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
                      Vista previa
                    </p>
                    <ul className="mt-2 space-y-1">
                      {item.highlights.map(highlight => (
                        <li key={highlight}>• {highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-mutedForeground">Precio</p>
                    <p className="text-2xl font-semibold">€{item.price}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    {isExpanded ? 'Ocultar vista previa' : 'Ver vista previa'}
                  </Button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {!isLoggedIn ? (
                    <Link to="/login" className="w-full sm:w-auto">
                      <Button className="w-full">Inicia sesión para comprar</Button>
                    </Link>
                  ) : (
                    <Button className="w-full sm:w-auto" onClick={() => handlePurchase(item.title)}>
                      Comprar ahora
                    </Button>
                  )}
                  <Button variant="outline" className="w-full sm:w-auto" disabled>
                    Guardar para después
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Store;
