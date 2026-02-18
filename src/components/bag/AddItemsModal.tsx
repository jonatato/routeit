import { useState, useMemo } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { BAG_CATEGORIES, getCategoryForItem } from '../../data/bagCategories';
import type { BagItem } from '../../data/bagItems';

interface AddItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableItems: BagItem[];
  checklistItemNames: string[];
  onAddItem: (item: BagItem) => void;
}

// Normalize text: remove accents, special characters, and convert to lowercase
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim();
};

export function AddItemsModal({
  isOpen,
  onClose,
  availableItems,
  checklistItemNames,
  onAddItem,
}: AddItemsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    let filtered = availableItems;

    // Filter by category
    if (selectedCategoryId) {
      const category = BAG_CATEGORIES.find(c => c.id === selectedCategoryId);
      if (category) {
        filtered = filtered.filter(item =>
          item.tags.some(tag => category.tags.includes(tag))
        );
      }
    }

    // Filter by search (normalized to ignore accents)
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeText(searchQuery);
      filtered = filtered.filter(item =>
        normalizeText(item.name).includes(normalizedQuery) ||
        item.tags.some(tag => normalizeText(tag).includes(normalizedQuery))
      );
    }

    return filtered;
  }, [availableItems, searchQuery, selectedCategoryId]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped = new Map<string, BagItem[]>();

    filteredItems.forEach(item => {
      const category = getCategoryForItem(item.tags);
      if (!grouped.has(category.id)) {
        grouped.set(category.id, []);
      }
      grouped.get(category.id)!.push(item);
    });

    return grouped;
  }, [filteredItems]);

  const isInChecklist = (itemName: string) => {
    return checklistItemNames.some(name => name.toLowerCase() === itemName.toLowerCase());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="fixed inset-x-0 bottom-0 top-12 md:inset-6 md:top-auto md:bottom-auto md:m-auto md:max-w-4xl md:max-h-[90vh] bg-background rounded-t-3xl md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 duration-300 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b bg-background p-4 rounded-t-3xl md:rounded-t-2xl">
          <h2 className="text-xl font-bold">Añadir Items</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex-shrink-0 bg-background p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar items..."
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex-shrink-0 bg-background px-4 py-3 border-b">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <Button
              variant={selectedCategoryId === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategoryId(null)}
              className="whitespace-nowrap"
            >
              Todas
            </Button>
            {BAG_CATEGORIES.map(category => {
              return (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)
                  }
                  className="whitespace-nowrap gap-1.5"
                  style={
                    selectedCategoryId === category.id
                      ? { backgroundColor: category.color, borderColor: category.color }
                      : {}
                  }
                >
                  <span>{category.emoji}</span>
                  <span className="hidden sm:inline">{category.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 pt-0 min-h-0">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg font-semibold text-muted-foreground">No se encontraron items</p>
              <p className="text-sm text-muted-foreground mt-1">
                Intenta con otra búsqueda o categoría
              </p>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {Array.from(itemsByCategory.entries()).map(([categoryId, items]) => {
                const category = BAG_CATEGORIES.find(c => c.id === categoryId)!;
                const CategoryIcon = category.icon;

                return (
                  <div key={categoryId}>
                    {/* Category Header - Sticky */}
                    <div 
                      className="sticky bg-muted backdrop-blur-md border-b-2 border-border -mx-4 px-4 py-3 mb-3 shadow-md z-20"
                      style={{ top: '0px' }}
                    >
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="h-5 w-5 flex-shrink-0" style={{ color: category.color }} />
                        <h3 className="font-semibold text-sm">{category.name}</h3>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid gap-2">
                      {items.map((item, index) => {
                      const alreadyAdded = isInChecklist(item.name);
                      const Icon = item.icon;

                      return (
                        <div
                          key={`${item.name}-${index}`}
                          className={`flex items-center gap-3 rounded-xl border bg-card p-3 transition-all ${
                            alreadyAdded
                              ? 'opacity-50 border-green-200 bg-green-50/50 dark:bg-green-950/20'
                              : 'border-border hover:border-primary/50 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {Icon && (
                              <div
                                className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                                style={{ backgroundColor: `${category.color}20` }}
                              >
                                <Icon className="h-4 w-4" style={{ color: category.color }} />
                              </div>
                            )}
                            <span className="font-medium truncate text-sm">{item.name}</span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {item.tags.slice(0, 1).map(tag => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                                style={{
                                  borderColor: `${category.color}40`,
                                  color: category.color,
                                }}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => onAddItem(item)}
                            disabled={alreadyAdded}
                            className="flex-shrink-0"
                            variant={alreadyAdded ? 'outline' : 'default'}
                          >
                            {alreadyAdded ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Añadido
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                Añadir
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
