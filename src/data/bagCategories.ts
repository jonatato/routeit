import { Backpack, ShirtIcon, Plug, Heart, FileText, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CategoryId = 'essentials' | 'clothing' | 'electronics' | 'health' | 'documents' | 'accessories';

export interface BagCategory {
  id: CategoryId;
  name: string;
  icon: LucideIcon;
  color: string;
  emoji: string;
  tags: string[]; // Tags que pertenecen a esta categoría
}

export const BAG_CATEGORIES: BagCategory[] = [
  {
    id: 'essentials',
    name: 'Esenciales',
    icon: Backpack,
    color: '#9b87f5',
    emoji: '🎒',
    tags: ['Dinero', 'Otros'],
  },
  {
    id: 'clothing',
    name: 'Ropa',
    icon: ShirtIcon,
    color: '#7dd3fc',
    emoji: '👕',
    tags: ['Ropa', 'Calzado'],
  },
  {
    id: 'electronics',
    name: 'Electrónica',
    icon: Plug,
    color: '#fbbf24',
    emoji: '🔌',
    tags: ['Tecnología'],
  },
  {
    id: 'health',
    name: 'Salud',
    icon: Heart,
    color: '#fb923c',
    emoji: '💊',
    tags: ['Salud', 'Higiene'],
  },
  {
    id: 'documents',
    name: 'Documentos',
    icon: FileText,
    color: '#60a5fa',
    emoji: '📄',
    tags: ['Documentos'],
  },
  {
    id: 'accessories',
    name: 'Accesorios',
    icon: Zap,
    color: '#a78bfa',
    emoji: '🎒',
    tags: ['Accesorios', 'Entretenimiento', 'Comida'],
  },
];

// Helper function to get category by tag
export function getCategoryByTag(tag: string): BagCategory | undefined {
  return BAG_CATEGORIES.find(cat => cat.tags.includes(tag));
}

// Helper function to get category for an item (uses first matching tag)
export function getCategoryForItem(itemTags: string[]): BagCategory {
  for (const tag of itemTags) {
    const category = getCategoryByTag(tag);
    if (category) return category;
  }
  // Default to essentials if no match
  return BAG_CATEGORIES[0];
}
