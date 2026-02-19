import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
}

export function FloatingActionButton({ 
  onClick, 
  label = 'Añadir', 
  icon = <Plus className="h-6 w-6" /> 
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-safe-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/95 to-primary text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 md:hidden"
      aria-label={label}
    >
      {icon}
    </button>
  );
}
