import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

function PrivateHub() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Espacio privado</h1>
              <p className="text-sm text-mutedForeground">Tu espacio personal para planificar y compartir.</p>
            </div>
            <Link to="/app">
              <Button variant="outline">Volver al itinerario</Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Mis itinerarios</CardTitle>
                <CardDescription>Gestiona y comparte tus viajes.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/app/itineraries">
                  <Button className="w-full">Abrir</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mi maleta</CardTitle>
                <CardDescription>Checklist privada por categorías.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/app/bag">
                  <Button className="w-full">Abrir</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Split</CardTitle>
                <CardDescription>Divide gastos entre participantes.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/app/split">
                  <Button className="w-full">Abrir</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
    </div>
  );
}

export default PrivateHub;
