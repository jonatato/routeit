import { useState, useEffect } from 'react';
import { Search, X, MapPin, Clock, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';
import { fetchUserItinerary } from '../services/itinerary';

interface SearchResult {
  id: string;
  type: 'place' | 'activity' | 'restaurant' | 'day';
  title: string;
  description: string;
  location?: string;
  time?: string;
  tags?: string[];
}

interface SearchPageProps {
  onClose?: () => void;
}

function SearchPage({ onClose }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [itineraryId, setItineraryId] = useState<string | null>(null);

  useEffect(() => {
    const loadItinerary = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const itinerary = await fetchUserItinerary(user.id);
      if (itinerary) {
        setItineraryId(itinerary.id || null);
      }
    };
    loadItinerary();
  }, []);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim().length === 0) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      if (!itineraryId) {
        setResults([]);
        return;
      }

      const searchTerm = `%${searchQuery.toLowerCase()}%`;

      // Search in days
      const { data: days, error: daysError } = await supabase
        .from('days')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .or(`city.ilike.${searchTerm},plan.ilike.${searchTerm}`);

      if (daysError) throw daysError;

      // Search in schedule items
      const { data: scheduleItems, error: scheduleError } = await supabase
        .from('schedule_items')
        .select('*, days!inner(itinerary_id)')
        .eq('days.itinerary_id', itineraryId)
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},location.ilike.${searchTerm}`);

      if (scheduleError) throw scheduleError;

      // Search in locations
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .or(`city.ilike.${searchTerm},region.ilike.${searchTerm}`);

      if (locationsError) throw locationsError;

      // Map results
      const searchResults: SearchResult[] = [];

      // Add days
      days?.forEach(day => {
        searchResults.push({
          id: day.id,
          type: 'day',
          title: `Día ${day.day_label} - ${day.city}`,
          description: day.plan || '',
          time: day.date_text || day.date || '',
          tags: [day.kind],
        });
      });

      // Add schedule items
      scheduleItems?.forEach(item => {
        searchResults.push({
          id: item.id,
          type: item.kind === 'food' ? 'restaurant' : 'activity',
          title: item.title || '',
          description: item.description || '',
          location: item.location || '',
          time: item.time || '',
          tags: item.tags || [],
        });
      });

      // Add locations
      locations?.forEach(loc => {
        searchResults.push({
          id: loc.id,
          type: 'place',
          title: loc.city || '',
          description: loc.region || '',
          tags: [],
        });
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const typeLabels = {
    place: 'Lugar',
    activity: 'Actividad',
    restaurant: 'Restaurante',
    day: 'Día',
  };

  const typeIcons = {
    place: MapPin,
    activity: Tag,
    restaurant: Tag,
    day: Clock,
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar lugares, actividades, días..."
              className="w-full rounded-full border border-border bg-background py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              autoFocus
            />
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="overflow-y-auto p-4">
        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Buscando...</p>
          </div>
        ) : query.trim().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              Escribe para buscar en tu itinerario
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-sm text-muted-foreground">
              No se encontraron resultados para "{query}"
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-3">
            {results.map(result => {
              const Icon = typeIcons[result.type];
              return (
                <Link key={result.id} to="/app">
                  <Card className="transition-colors hover:bg-primary/5 hover:border-primary/30">
                    <CardHeader className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {typeLabels[result.type]}
                            </Badge>
                            {result.time && (
                              <span className="text-xs text-muted-foreground">{result.time}</span>
                            )}
                          </div>
                          <CardTitle className="text-base">{result.title}</CardTitle>
                          <CardDescription className="mt-1 text-sm">
                            {result.description}
                          </CardDescription>
                          {result.location && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {result.location}
                            </p>
                          )}
                          {result.tags && result.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {result.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
