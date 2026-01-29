import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { fetchChecklist, updateChecklistItem, addChecklistItem } from '../../services/bag';

interface ChecklistItem {
  id: string;
  name: string;
  checked: boolean;
  category: 'before' | 'during' | 'after';
  tags: string[];
}

interface TravelChecklistWidgetProps {
  itineraryId: string;
  userId: string;
}

// Map tags to categories
const getCategoryFromTags = (tags: string[]): 'before' | 'during' | 'after' => {
  if (tags.some(t => t.includes('antes') || t.includes('pre') || t.includes('reserva'))) {
    return 'before';
  }
  if (tags.some(t => t.includes('durante') || t.includes('viaje'))) {
    return 'during';
  }
  if (tags.some(t => t.includes('después') || t.includes('post'))) {
    return 'after';
  }
  return 'before'; // Default
};

export function TravelChecklistWidget({ itineraryId, userId }: TravelChecklistWidgetProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('before');

  useEffect(() => {
    loadChecklist();
  }, [userId]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const data = await fetchChecklist();
      
      // Map to our internal format
      const mappedItems: ChecklistItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        checked: item.checked,
        category: getCategoryFromTags(item.tags),
        tags: item.tags,
      }));
      
      setItems(mappedItems);
    } catch (error) {
      console.error('Error loading checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newChecked = !item.checked;
    
    // Optimistic update
    setItems(items.map(i => i.id === id ? { ...i, checked: newChecked } : i));

    try {
      await updateChecklistItem(id, { checked: newChecked });
    } catch (error) {
      console.error('Error updating checklist item:', error);
      // Revert on error
      setItems(items.map(i => i.id === id ? { ...i, checked: !newChecked } : i));
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const newItem = await addChecklistItem(newTaskTitle, ['before']);
      setItems(prev => [...prev, {
        id: newItem.id,
        name: newItem.name,
        checked: newItem.checked,
        category: 'before',
        tags: newItem.tags,
      }]);
      setNewTaskTitle('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding checklist item:', error);
    }
  };

  const getCategoryItems = (category: 'before' | 'during' | 'after') => {
    return items.filter(item => item.category === category);
  };

  const getCategoryProgress = (category: 'before' | 'during' | 'after') => {
    const categoryItems = getCategoryItems(category);
    if (categoryItems.length === 0) return 0;
    const completed = categoryItems.filter(i => i.checked).length;
    return Math.round((completed / categoryItems.length) * 100);
  };

  const totalProgress = items.length > 0 
    ? Math.round((items.filter(i => i.checked).length / items.length) * 100)
    : 0;

  const categoryLabels = {
    before: '✈️ Antes del viaje',
    during: '🌍 Durante el viaje',
    after: '🏠 Después del viaje',
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 w-32 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-2 w-full rounded bg-muted" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 w-full rounded bg-muted" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="text-lg">✅</span>
          Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progreso General</span>
            <span className="font-semibold text-primary">{totalProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <div className="mt-1 text-center text-xs text-muted-foreground">
            {items.filter(i => i.checked).length} / {items.length} tareas completadas
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          {(['before', 'during', 'after'] as const).map(category => {
            const categoryItems = getCategoryItems(category);
            const isExpanded = expandedCategory === category;
            const progress = getCategoryProgress(category);

            return (
              <div key={category} className="rounded-lg border border-border">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {categoryLabels[category]}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{progress}%</span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Category Items */}
                {isExpanded && categoryItems.length > 0 && (
                  <div className="space-y-1 border-t border-border p-2">
                    {categoryItems.map(item => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-2 rounded p-2 transition-colors hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleItem(item.id)}
                          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <span className={`text-sm ${
                          item.checked ? 'text-muted-foreground line-through' : 'text-foreground'
                        }`}>
                          {item.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Task */}
        {showAddForm ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Nueva tarea..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <Button onClick={addTask} size="sm">
              Añadir
            </Button>
            <Button onClick={() => setShowAddForm(false)} size="sm" variant="ghost">
              ✕
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir tarea
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
