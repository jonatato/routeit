import { useState } from 'react';
import { Search, X, MapPin, Clock, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

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

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'place',
      title: 'Puerta de Brandeburgo',
      description: 'Monumento histórico icónico',
      location: 'Berlín',
      tags: ['histórico', 'monumento'],
    },
    {
      id: '2',
      type: 'activity',
      title: 'Visitar Museum Island',
      description: 'Complejo de museos de clase mundial',
      location: 'Berlín',
      time: '10:00',
      tags: ['cultura', 'museo'],
    },
    {
      id: '3',
      type: 'restaurant',
      title: 'Curry 36',
      description: 'Famoso puesto de currywurst',
      location: 'Kreuzberg',
      tags: ['comida', 'alemán'],
    },
    {
      id: '4',
      type: 'day',
      title: 'Día 3 - Berlín histórico',
      description: 'Recorrido por el centro histórico y hutongs',
      time: 'Dom 11',
      tags: ['día', 'berlín'],
    },
  ];

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      // Simular búsqueda
      setTimeout(() => {
        const filtered = mockResults.filter(
          result =>
            result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setResults(filtered);
        setIsSearching(false);
      }, 300);
    } else {
      setResults([]);
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
                  <Card className="transition-colors hover:bg-muted/50">
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
