import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import FullscreenLoader from '../components/FullscreenLoader';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';

type StoreItineraryPreview = {
  id: string;
  title: string;
  subtitle?: string | null;
  coverImageUrl?: string | null;
  galleryImageUrls?: string[] | null;
  summary: string;
  price: number;
  days: number;
  cities: number;
  region: string;
  tags: string[];
  highlights: string[];
  hook?: string | null;
  whoIsFor?: string[] | null;
  whatYouGet?: string[] | null;
  durationDays?: number | null;
  bestSeason?: string[] | null;
  difficulty?: string | null;
  styleTags?: string[] | null;
  country?: string | null;
  regions?: string[] | null;
  citiesList?: string[] | null;
  pricingTier?: string | null;
  estimatedDaily?: number | null;
  currency?: string | null;
  itineraryOverview?: string | null;
  extras?: Record<string, string[]> | null;
  assets?: Record<string, string[] | string> | null;
};

function Store() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<StoreItineraryPreview | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<StoreItineraryPreview[]>([]);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const handleSearchChange = (value: string) => {
    setIsLoading(true);
    setSearchQuery(value);
  };

  const handleTagChange = (tag: string | null) => {
    setIsLoading(true);
    setActiveTag(tag);
  };

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(Boolean(data.user));
    };
    void loadUser();
  }, []);

  useEffect(() => {
    let isActive = true;

    const timer = setTimeout(async () => {
      const { data, error } = await supabase.functions.invoke('store-search', {
        body: {
          query: searchQuery.trim(),
          tags: activeTag ? [activeTag] : [],
        },
      });
      if (!isActive) return;
      if (error) {
        toast.error('No se pudieron cargar los viajes de la tienda.');
        setItems([]);
        setIsLoading(false);
        return;
      }
      const rows = (data?.data ?? []) as Array<{
        id: string;
        title: string;
        subtitle?: string | null;
        preview_summary?: string | null;
        preview_price?: number | null;
        preview_days?: number | null;
        preview_cities?: number | null;
        preview_region?: string | null;
        preview_tags?: string[] | null;
        preview_highlights?: string[] | null;
        cover_image_url?: string | null;
      }>;

      setItems(
        rows.map(row => ({
          id: row.id,
          title: row.title,
          subtitle: row.subtitle,
          coverImageUrl: row.cover_image_url ?? null,
          summary: row.preview_summary ?? row.hook ?? '',
          price: Number(row.preview_price ?? 0),
          days: Number(row.preview_days ?? 0),
          cities: Number(row.preview_cities ?? 0),
          region: row.preview_region ?? '',
          tags: row.preview_tags ?? [],
          highlights: row.preview_highlights ?? [],
        })),
      );
      setIsLoading(false);
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [activeTag, searchQuery, toast]);

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach(item => item.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [items]);

  const filtered = useMemo(() => items, [items]);

  const handlePurchase = (title: string) => {
    toast.error(`Compra de "${title}" disponible próximamente.`);
  };

  useEffect(() => {
    if (!previewItem || !previewRef.current) return;
    const ctx = gsap.context(() => {
      gsap.set('[data-preview-hero]', { opacity: 0, y: 16 });
      gsap.set('[data-preview-step]', { opacity: 0, y: 24 });
      gsap.set('[data-preview-card]', { opacity: 0, y: 20 });

      const tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.5 } });
      tl.to('[data-preview-hero]', { opacity: 1, y: 0, stagger: 0.08 })
        .to('[data-preview-card]', { opacity: 1, y: 0, stagger: 0.08 }, '-=0.2')
        .to('[data-preview-step]', { opacity: 1, y: 0, stagger: 0.12 }, '-=0.2');
    }, previewRef);

    return () => ctx.revert();
  }, [previewItem]);

  const renderExtras = (label: string, items?: string[] | null) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">{label}</p>
        <ul className="space-y-1 text-sm text-mutedForeground">
          {items.map(item => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    );
  };

  if (isLoading) {
    return <FullscreenLoader message="Cargando viajes..." />;
  }

  return (
    <div className="min-h-screen bg-background">
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
            onChange={event => handleSearchChange(event.target.value)}
            placeholder="Buscar por destino o estilo"
            className="w-full rounded-full border border-border bg-card px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label="Buscar itinerarios"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTag ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => handleTagChange(null)}
          >
            Todos
          </Button>
          {tags.map(tag => (
            <Button
              key={tag}
              variant={activeTag === tag ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => handleTagChange(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
        {filtered.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <div className="h-48 w-full overflow-hidden">
                {item.coverImageUrl ? (
                  <img src={item.coverImageUrl} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-mutedForeground">
                    Sin imagen
                  </div>
                )}
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

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-mutedForeground">Precio</p>
                    <p className="text-2xl font-semibold">€{item.price}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewItem(item)}
                  >
                    Ver vista previa
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
        ))}
        </div>

        <Dialog open={Boolean(previewItem)} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-5xl">
          {previewItem && (
            <div
              ref={previewRef}
              className="grid gap-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
            >
              <div className="space-y-5">
                <DialogHeader data-preview-hero>
                  <DialogTitle>{previewItem.title}</DialogTitle>
                  <p className="text-sm text-mutedForeground">
                    {previewItem.subtitle ?? previewItem.hook}
                  </p>
                </DialogHeader>

                <div className="flex flex-wrap gap-2 text-xs" data-preview-hero>
                  {(previewItem.styleTags ?? previewItem.tags).map(tag => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-3 py-1 font-semibold text-mutedForeground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {previewItem.itineraryOverview && (
                  <p className="text-sm text-mutedForeground" data-preview-hero>
                    {previewItem.itineraryOverview}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2" data-preview-card>
                  <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-mutedForeground">Duracion</p>
                    <p className="font-semibold">
                      {previewItem.durationDays ?? previewItem.days} dias
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-mutedForeground">Destino</p>
                    <p className="font-semibold">
                      {previewItem.country ?? previewItem.region}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-mutedForeground">Temporada</p>
                    <p className="font-semibold">
                      {(previewItem.bestSeason ?? []).join(', ') || 'Todo el ano'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-mutedForeground">Precio diario</p>
                    <p className="font-semibold">
                      {previewItem.estimatedDaily ?? previewItem.price} {previewItem.currency ?? 'EUR'}
                    </p>
                  </div>
                </div>

                {previewItem.whatYouGet && previewItem.whatYouGet.length > 0 && (
                  <div className="space-y-2" data-preview-card>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
                      Lo que incluye
                    </p>
                    <ul className="space-y-1 text-sm text-mutedForeground">
                      {previewItem.whatYouGet.map(item => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {previewItem.whoIsFor && previewItem.whoIsFor.length > 0 && (
                  <div className="space-y-2" data-preview-card>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
                      Ideal para
                    </p>
                    <ul className="space-y-1 text-sm text-mutedForeground">
                      {previewItem.whoIsFor.map(item => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2" data-preview-card>
                  {renderExtras('Sabores clave', previewItem.extras?.foods)}
                  {renderExtras('Tips utiles', previewItem.extras?.tips)}
                  {renderExtras('Que evitar', previewItem.extras?.avoid)}
                  {renderExtras('Imprescindibles', previewItem.extras?.packing)}
                </div>

                <div className="space-y-3" data-preview-card>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
                    Recorrido del viaje
                  </p>
                  <div className="grid gap-3">
                    {[
                      {
                        title: 'Llegada suave',
                        detail: 'Check-in rapido, ritmo calmado y primeras vistas clave.',
                      },
                      {
                        title: 'Capas de cultura',
                        detail: 'Iconos, barrios y rutas con tiempos realistas.',
                      },
                      {
                        title: 'Sabores y momentos wow',
                        detail: 'Gastronomia local + planes con chispa.',
                      },
                      {
                        title: 'Cierre redondo',
                        detail: 'Ultimos esenciales sin prisas ni carreras.',
                      },
                    ].map(step => (
                      <div
                        key={step.title}
                        className="flex gap-3 rounded-2xl border border-border bg-card/85 p-3"
                        data-preview-step
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {step.title.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{step.title}</p>
                          <p className="text-xs text-mutedForeground">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4" data-preview-card>
                <div className="overflow-hidden rounded-2xl border border-border">
                  {previewItem.coverImageUrl ? (
                    <img
                      src={previewItem.coverImageUrl}
                      alt={previewItem.title}
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center bg-muted text-sm text-mutedForeground">
                      Sin imagen
                    </div>
                  )}
                </div>

                {previewItem.galleryImageUrls && previewItem.galleryImageUrls.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {previewItem.galleryImageUrls.slice(0, 4).map(url => (
                      <div key={url} className="overflow-hidden rounded-xl border border-border">
                        <img src={url} alt="Vista del viaje" className="h-28 w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
                    Highlights
                  </p>
                  <ul className="mt-2 space-y-1 text-mutedForeground">
                    {previewItem.highlights.map(highlight => (
                      <li key={highlight}>• {highlight}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default Store;
