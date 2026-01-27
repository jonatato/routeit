import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, DollarSign, Info, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';
import { PandaLogo } from '../components/PandaLogo';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: GuideItem[];
}

interface GuideItem {
  id: string;
  title: string;
  description: string;
  tips?: string[];
}

function Guide() {
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    console.log('[Guide] useEffect starting');
    const loadGuideData = async () => {
      try {
        console.log('[Guide] loadGuideData starting');
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[Guide] User:', user?.id || 'NO USER');
        if (!user) {
          setHasData(false);
          setLoading(false);
          return;
        }

        // Get user's most recent itinerary
        const { data: itinerary, error: itineraryError } = await supabase
          .from('itineraries')
          .select('id')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('[Guide] Itinerary query result:', { itinerary, itineraryError });

        if (!itinerary) {
          console.log('[Guide] No itinerary, setting hasData=false');
          setHasData(false);
          setLoading(false);
          return;
        }

        // Fetch phrases from the itinerary (this is where guide data could be stored)
        const { data: phrases, error: phrasesError } = await supabase
          .from('phrases')
          .select('*')
          .eq('itinerary_id', itinerary.id);

        console.log('[Guide] Phrases query result:', { phrasesCount: phrases?.length || 0, phrasesError });

        // For now, we don't have structured guide sections, only phrases
        // We'll consider "no data" until we implement proper guide section formatting
        // Check if there are any phrases (guide data)
        console.log('[Guide] No structured guide sections, setting hasData=false');
        setHasData(false);
        setSections([]);
        
        console.log('[Guide] Setting loading=false');
        setLoading(false);

      } catch (error) {
        console.error('Error loading guide data:', error);
        setHasData(false);
        setSections([]);
        setLoading(false);
      }
    };

    loadGuideData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-white px-4 py-4 md:hidden">
          <div className="flex items-center gap-3">
            <Link to="/app">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">Guía de Viaje</h1>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="mb-6 hidden md:block">
            <h1 className="text-3xl font-bold">Guía de Viaje</h1>
            <p className="text-muted-foreground">Información útil para tu viaje</p>
          </div>

          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-white px-4 py-4 md:hidden">
          <div className="flex items-center gap-3">
            <Link to="/app">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">Guía de Viaje</h1>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="mb-6 hidden md:block">
            <h1 className="text-3xl font-bold">Guía de Viaje</h1>
            <p className="text-muted-foreground">Información útil para tu viaje</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
            <PandaLogo size="lg" className="opacity-50" />
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">No hay información de guía disponible</h2>
              <p className="text-muted-foreground max-w-md">
                Aún no has agregado información de guía para tu itinerario. Puedes agregar frases útiles, consejos y otra información desde la sección de administración.
              </p>
              <Link to="/app/admin">
                <Button size="lg">
                  Ir a administración
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Mobile */}
      <div className="border-b border-border bg-white px-4 py-4 md:hidden">
        <div className="flex items-center gap-3">
          <Link to="/app">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Guía de Viaje</h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Desktop Header */}
        <div className="mb-6 hidden md:block">
          <h1 className="text-3xl font-bold">Guía de Viaje</h1>
          <p className="text-muted-foreground">Información útil para tu viaje</p>
        </div>

        <div className="space-y-6">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <div key={section.id}>
                <div className="mb-4 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold">{section.title}</h2>
                </div>
                <div className="space-y-4">
                  {section.items.map(item => (
                    <Card key={item.id}>
                      <CardHeader>
                        <CardTitle>{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      {item.tips && (
                        <CardContent>
                          <div className="space-y-2">
                            {item.tips.map((tip, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Badge variant="secondary" className="mt-0.5 shrink-0">
                                  {index + 1}
                                </Badge>
                                <p className="text-sm text-muted-foreground">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Guide;
