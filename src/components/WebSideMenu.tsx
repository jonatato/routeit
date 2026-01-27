import { Link } from 'react-router-dom';
import { Button } from './ui/button';

function WebSideMenu() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-2 border-r border-border bg-background px-4 py-6 md:flex">
      <Link to="/app">
        <Button variant="ghost" className="w-full justify-start">
          Itinerario
        </Button>
      </Link>
      <Link to="/app/private">
        <Button variant="ghost" className="w-full justify-start">
          Privado
        </Button>
      </Link>
      <Link to="/app/itineraries">
        <Button variant="ghost" className="w-full justify-start">
          Mis itinerarios
        </Button>
      </Link>
      <Link to="/app/bag">
        <Button variant="ghost" className="w-full justify-start">
          Maleta
        </Button>
      </Link>
      <Link to="/app/split">
        <Button variant="ghost" className="w-full justify-start">
          Split
        </Button>
      </Link>
      <Link to="/app/admin">
        <Button variant="ghost" className="w-full justify-start">
          Admin
        </Button>
      </Link>
      <Link to="/app/profile">
        <Button variant="ghost" className="w-full justify-start">
          Perfil
        </Button>
      </Link>
    </aside>
  );
}

export default WebSideMenu;
