import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Check } from 'lucide-react';
import { useIsMobileShell } from '../../hooks/useIsMobileShell';

interface Tag {
  id: string;
  name: string;
  slug: string;
  isCity?: boolean;
}

interface VideoFiltersProps {
  tags: Tag[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  onClearFilters: () => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function VideoFilters({
  tags,
  selectedTags,
  onToggleTag,
  onClearFilters,
  onClose,
  isOpen = true,
}: VideoFiltersProps) {
  const isMobile = useIsMobileShell();

  const cityTags = tags.filter(t => t.isCity);
  const customTags = tags.filter(t => !t.isCity);

  if (!isOpen) return null;

  // Mobile: Fullscreen modal
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background animate-in fade-in-0 slide-in-from-bottom-5 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Filtros</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 pb-24 overflow-y-auto h-[calc(100vh-120px)]">
          {/* City Tags */}
          {cityTags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                📍 Ciudades de la Ruta
                {selectedTags.filter(id => cityTags.find(t => t.id === id)).length > 0 && (
                  <Badge variant="default" className="ml-auto">
                    {selectedTags.filter(id => cityTags.find(t => t.id === id)).length}
                  </Badge>
                )}
              </h3>
              <div className="flex gap-2 flex-wrap">
                {cityTags.map(tag => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => onToggleTag(tag.id)}
                      className={`
                        px-4 py-2.5 rounded-full font-medium text-sm
                        transition-all duration-200 transform active:scale-95
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                          : 'bg-muted text-foreground hover:bg-accent'
                        }
                      `}
                    >
                      <span className="flex items-center gap-2">
                        {tag.name}
                        {isSelected && <Check className="h-4 w-4" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Tags */}
          {customTags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                🏷️ Tags Personalizados
                {selectedTags.filter(id => customTags.find(t => t.id === id)).length > 0 && (
                  <Badge variant="default" className="ml-auto">
                    {selectedTags.filter(id => customTags.find(t => t.id === id)).length}
                  </Badge>
                )}
              </h3>
              <div className="flex gap-2 flex-wrap">
                {customTags.map(tag => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => onToggleTag(tag.id)}
                      className={`
                        px-4 py-2.5 rounded-full font-medium text-sm
                        transition-all duration-200 transform active:scale-95
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                          : 'bg-muted text-foreground hover:bg-accent'
                        }
                      `}
                    >
                      <span className="flex items-center gap-2">
                        #{tag.name}
                        {isSelected && <Check className="h-4 w-4" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tags.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay tags disponibles</p>
            </div>
          )}
        </div>

        {/* Footer - Sticky bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex gap-2">
          {selectedTags.length > 0 && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="flex-1"
            >
              Limpiar ({selectedTags.length})
            </Button>
          )}
          <Button
            onClick={onClose}
            className="flex-1"
          >
            Aplicar Filtros
          </Button>
        </div>
      </div>
    );
  }

  // Desktop: Card layout
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>🔍 Filtrar Videos</span>
          {selectedTags.length > 0 && (
            <Badge variant="default" className="ml-2">
              {selectedTags.length} activo{selectedTags.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* City Tags */}
        {cityTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              📍 Ciudades
            </p>
            <div className="flex gap-2 flex-wrap p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              {cityTags.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <Badge
                    key={tag.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`
                      cursor-pointer transition-all duration-200
                      hover:scale-105 active:scale-95
                      ${isSelected 
                        ? 'shadow-sm' 
                        : 'hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-300'
                      }
                    `}
                    onClick={() => onToggleTag(tag.id)}
                  >
                    {tag.name}
                    {isSelected && <Check className="ml-1 h-3 w-3" />}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Tags */}
        {customTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              🏷️ Tags Personalizados
            </p>
            <div className="flex gap-2 flex-wrap p-3 bg-muted rounded-lg">
              {customTags.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <Badge
                    key={tag.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`
                      cursor-pointer transition-all duration-200
                      hover:scale-105 active:scale-95
                      ${isSelected ? 'shadow-sm' : 'hover:bg-accent'}
                    `}
                    onClick={() => onToggleTag(tag.id)}
                  >
                    #{tag.name}
                    {isSelected && <Check className="ml-1 h-3 w-3" />}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {selectedTags.length > 0 && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        )}

        {tags.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay tags disponibles
          </p>
        )}
      </CardContent>
    </Card>
  );
}
