import React from 'react';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMobile?: boolean;
}

const sections = [
  { id: 'general', label: 'General', icon: '📋' },
  { id: 'days', label: 'Días', icon: '🗓️' },
  { id: 'flights', label: 'Vuelos', icon: '✈️' },
  { id: 'budget', label: 'Presupuesto', icon: '💰' },
  { id: 'lists', label: 'Listas', icon: '📝' },
  { id: 'map', label: 'Mapa', icon: '🗺️' },
  { id: 'phrases', label: 'Frases', icon: '🗣️' },
  { id: 'tags', label: 'Etiquetas', icon: '🏷️' },
];

export function AdminSidebar({ activeSection, onSectionChange, isMobile = false }: AdminSidebarProps) {
  if (isMobile) {
    return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar p-4 bg-muted/30 rounded-lg">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg whitespace-nowrap transition-all shrink-0 ${
              activeSection === section.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-background text-muted-foreground hover:bg-primary/10 hover:text-primary'
            }`}
          >
            <span className="text-xl">{section.icon}</span>
            <span className="text-xs font-semibold">{section.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <aside className="hidden md:flex flex-col gap-1 w-56 h-fit bg-muted/30 rounded-lg p-2 sticky top-4">
      {sections.map(section => (
        <button
          key={section.id}
          onClick={() => onSectionChange(section.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            activeSection === section.id
              ? 'bg-primary text-white shadow-md'
              : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
          }`}
        >
          <span className="text-lg">{section.icon}</span>
          <span>{section.label}</span>
        </button>
      ))}
    </aside>
  );
}
