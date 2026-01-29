import { LayoutGrid, Plane, Wallet, MapPin, MessageSquare, Calendar, Tag } from 'lucide-react';
import { Button } from './ui/button';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMobile: boolean;
}

const sections = [
  { id: 'general', label: 'General', icon: LayoutGrid },
  { id: 'flights', label: 'Vuelos', icon: Plane },
  { id: 'budget', label: 'Presupuesto', icon: Wallet },
  { id: 'map', label: 'Mapa', icon: MapPin },
  { id: 'lists', label: 'Listas', icon: MessageSquare },
  { id: 'phrases', label: 'Frases', icon: MessageSquare },
  { id: 'days', label: 'Días', icon: Calendar },
  { id: 'tags', label: 'Etiquetas', icon: Tag },
];

export function AdminSidebar({ activeSection, onSectionChange, isMobile }: AdminSidebarProps) {
  return (
    <nav className={isMobile ? 'space-y-2 px-4 py-3' : 'space-y-1'}>
      {sections.map(section => {
        const Icon = section.icon;
        return (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'default' : 'ghost'}
            className={isMobile ? 'w-full justify-start' : 'w-full justify-start'}
            onClick={() => onSectionChange(section.id)}
          >
            <Icon className="mr-2 h-4 w-4" />
            {section.label}
          </Button>
        );
      })}
    </nav>
  );
}
