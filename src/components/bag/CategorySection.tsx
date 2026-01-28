import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import type { BagCategory } from '../../data/bagCategories';
import type { BagItem } from '../../data/bagItems';

interface CategorySectionProps {
  category: BagCategory;
  items: Array<{ id: string; name: string; checked: boolean; tags: string[] }>;
  onToggleCheck: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  allBagItems: BagItem[];
}

export function CategorySection({
  category,
  items,
  onToggleCheck,
  onDelete,
  allBagItems,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = items.filter(item => item.checked).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const CategoryIcon = category.icon;

  if (totalCount === 0) {
    return (
      <Card className="border-dashed opacity-60">
        <CardHeader className="pb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left hover:bg-primary/5 rounded-lg p-2 -m-2 transition-colors"
      >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <CategoryIcon className="h-5 w-5" style={{ color: category.color }} />
              </div>
              <div>
                <h3 className="font-semibold text-base">{category.emoji} {category.name}</h3>
                <p className="text-xs text-muted-foreground">Vacía - Añade items</p>
              </div>
            </div>
          </button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden transition-all duration-300">
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between text-left hover:bg-primary/5 rounded-lg p-2 -m-2 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <CategoryIcon className="h-5 w-5" style={{ color: category.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{category.emoji} {category.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: category.color,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {percentage}% ({completedCount}/{totalCount})
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 ml-2">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2 pt-0 animate-in slide-in-from-top-2 duration-300">
          {items.map(item => {
            const templateItem = allBagItems.find(i => i.name.toLowerCase() === item.name.toLowerCase());
            const Icon = templateItem?.icon;

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-2.5 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => onToggleCheck(item.id, item.checked)}
                  className="h-5 w-5 rounded border-border flex-shrink-0 cursor-pointer"
                />
                {Icon && (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: category.color }} />
                  </div>
                )}
                <span
                  className={`flex-1 truncate transition-all text-sm ${
                    item.checked ? 'line-through text-muted-foreground opacity-60' : 'text-foreground'
                  }`}
                >
                  {item.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                >
                  Quitar
                </Button>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
