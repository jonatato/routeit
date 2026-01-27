import { useState } from 'react';
import { ArrowLeft, MapPin, Clock, DollarSign, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

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
  const [sections] = useState<GuideSection[]>([
    {
      id: 'transport',
      title: 'Transporte',
      icon: MapPin,
      items: [
        {
          id: '1',
          title: 'Metro y Tren',
          description: 'Berlín cuenta con un excelente sistema de transporte público (U-Bahn, S-Bahn)',
          tips: [
            'Compra la Berlin WelcomeCard para transporte ilimitado',
            'Los trenes funcionan hasta la 1:00 AM aproximadamente',
            'Los fines de semana hay servicio nocturno',
          ],
        },
        {
          id: '2',
          title: 'Bicicletas',
          description: 'Berlín es muy amigable con las bicicletas',
          tips: [
            'Alquila bicicletas en estaciones Nextbike o Lime',
            'Respeta los carriles bici señalizados',
            'Usa casco aunque no sea obligatorio',
          ],
        },
      ],
    },
    {
      id: 'money',
      title: 'Dinero y Pagos',
      icon: DollarSign,
      items: [
        {
          id: '3',
          title: 'Moneda',
          description: 'Alemania usa el Euro (€)',
          tips: [
            'Muchos lugares aceptan tarjeta, pero lleva efectivo',
            'Los restaurantes pequeños prefieren efectivo',
            'Cajeros automáticos disponibles en toda la ciudad',
          ],
        },
        {
          id: '4',
          title: 'Propinas',
          description: 'Las propinas son esperadas pero no obligatorias',
          tips: [
            'Redondea la cuenta en restaurantes (5-10%)',
            'En taxis, redondea al euro más cercano',
            'En bares, deja las monedas de cambio',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: 'Consejos Útiles',
      icon: Info,
      items: [
        {
          id: '5',
          title: 'Horarios',
          description: 'Los alemanes son muy puntuales',
          tips: [
            'Las tiendas cierran temprano los domingos',
            'Los supermercados abren hasta las 20:00-22:00',
            'Los restaurantes suelen cerrar entre comidas',
          ],
        },
        {
          id: '6',
          title: 'Idioma',
          description: 'El alemán es el idioma oficial',
          tips: [
            'Muchos hablan inglés, especialmente jóvenes',
            'Aprende frases básicas en alemán',
            'Usa Google Translate como respaldo',
          ],
        },
      ],
    },
  ]);

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
