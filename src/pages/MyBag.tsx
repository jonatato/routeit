import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { allBagItems, allTags } from '../data/bagItems';
import { addChecklistItem, deleteChecklistItem, fetchChecklist, updateChecklistItem } from '../services/bag';
import { useEffect } from 'react';

function MyBag() {
  const [isLoading, setIsLoading] = useState(true);
  const [checklistItems, setChecklistItems] = useState<Array<{ id: string; name: string; checked: boolean; tags: string[] }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const data = await fetchChecklist();
    setChecklistItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  // Filtrar items predefinidos según búsqueda y etiqueta
  const filteredItems = useMemo(() => {
    let filtered = allBagItems;

    // Filtrar por etiqueta
    if (selectedTag) {
      filtered = filtered.filter(item => item.tags.includes(selectedTag));
    }

    // Filtrar por búsqueda (nombre o etiquetas)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(query);
        const tagsMatch = item.tags.some(tag => tag.toLowerCase().includes(query));
        return nameMatch || tagsMatch;
      });
    }

    return filtered;
  }, [searchQuery, selectedTag]);

  // Verificar si un item ya está en el checklist
  const isInChecklist = (itemName: string) => {
    return checklistItems.some(item => item.name.toLowerCase() === itemName.toLowerCase());
  };

  const handleAddToChecklist = async (item: typeof allBagItems[number]) => {
    if (isInChecklist(item.name)) return;
    
    try {
      const newItem = await addChecklistItem(item.name, item.tags);
      setChecklistItems(prev => [...prev, newItem]);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleToggleCheck = async (id: string, checked: boolean) => {
    try {
      await updateChecklistItem(id, { checked: !checked });
      setChecklistItems(prev =>
        prev.map(item => (item.id === id ? { ...item, checked: !checked } : item))
      );
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChecklistItem(id);
      setChecklistItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-center">
        <p className="text-sm text-mutedForeground">Cargando maleta...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Mi maleta</h1>
          <p className="text-sm text-mutedForeground">Checklist personal para tu viaje.</p>
        </div>
        <Link to="/app/private">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      {/* Checklist del usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Mi checklist</CardTitle>
          <CardDescription>
            {checklistItems.length} {checklistItems.length === 1 ? 'item' : 'items'} ·{' '}
            {checklistItems.filter(i => i.checked).length} completados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklistItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-mutedForeground">
              Tu checklist está vacía. Añade items desde el listado de abajo.
            </p>
          ) : (
            checklistItems.map(item => {
              const templateItem = allBagItems.find(i => i.name.toLowerCase() === item.name.toLowerCase());
              const Icon = templateItem?.icon;
              
              return (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleToggleCheck(item.id, item.checked)}
                      className="h-5 w-5 rounded border-border flex-shrink-0"
                    />
                    {Icon && <Icon className="h-5 w-5 text-mutedForeground flex-shrink-0" />}
                    <span className={`flex-1 truncate ${item.checked ? 'line-through text-mutedForeground' : ''}`}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs whitespace-nowrap">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive hover:text-destructive w-full sm:w-auto flex-shrink-0"
                  >
                    Quitar
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Buscador y filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Items predefinidos</CardTitle>
          <CardDescription>Busca y añade items a tu checklist.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedForeground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o etiqueta..."
              className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm"
            />
          </div>

          {/* Filtros por etiqueta */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTag(null)}
            >
              Todas
            </Button>
            {allTags.map(tag => (
              <Button
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </Button>
            ))}
          </div>

          {/* Lista de items */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-mutedForeground">
                No se encontraron items con los filtros seleccionados.
              </p>
            ) : (
              filteredItems.map((item, index) => {
                const alreadyAdded = isInChecklist(item.name);
                const Icon = item.icon;
                
                return (
                  <div
                    key={`${item.name}-${index}`}
                    className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg border border-border bg-card p-3 ${
                      alreadyAdded ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {Icon && <Icon className="h-5 w-5 text-mutedForeground flex-shrink-0" />}
                      <span className="font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      {item.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs whitespace-nowrap">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant={alreadyAdded ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleAddToChecklist(item)}
                      disabled={alreadyAdded}
                      className="w-full sm:w-auto flex-shrink-0"
                    >
                      {alreadyAdded ? 'Añadido' : 'Añadir'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MyBag;
