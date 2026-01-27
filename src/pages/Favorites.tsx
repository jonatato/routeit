import { useState } from 'react';
import { ArrowLeft, Heart, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface Favorite {
  id: string;
  type: 'place' | 'restaurant' | 'activity' | 'hotel';
  name: string;
  location: string;
  description: string;
  rating?: number;
  imageUrl?: string;
}

function Favorites() {
  const [favorites] = useState<Favorite[]>([
    {
      id: '1',
      type: 'place',
      name: 'Puerta de Brandeburgo',
      location: 'Berlín, Alemania',
      description: 'Monumento histórico icónico en el corazón de Berlín',
      rating: 4.8,
    },
    {
      id: '2',
      type: 'restaurant',
      name: 'Curry 36',
      location: 'Berlín, Alemania',
      description: 'Famoso puesto de currywurst berlinés',
      rating: 4.5,
    },
    {
      id: '3',
      type: 'activity',
      name: 'Museum Island',
      location: 'Berlín, Alemania',
      description: 'Complejo de museos de clase mundial',
      rating: 4.9,
    },
  ]);

  const typeLabels = {
    place: 'Lugar',
    restaurant: 'Restaurante',
    activity: 'Actividad',
    hotel: 'Hotel',
  };

  const typeColors = {
    place: 'default',
    restaurant: 'secondary',
    activity: 'accent',
    hotel: 'primary',
  } as const;

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
          <h1 className="text-lg font-bold">Favoritos</h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Desktop Header */}
        <div className="mb-6 hidden md:block">
          <h1 className="text-3xl font-bold">Favoritos</h1>
          <p className="text-muted-foreground">Tus lugares y actividades guardados</p>
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Aún no tienes favoritos guardados.
                <br />
                Explora lugares y guárdalos aquí.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {favorites.map(favorite => (
              <Card key={favorite.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant={typeColors[favorite.type]}>
                          {typeLabels[favorite.type]}
                        </Badge>
                        {favorite.rating && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{favorite.rating}</span>
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-xl">{favorite.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {favorite.location}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500">
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{favorite.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;
