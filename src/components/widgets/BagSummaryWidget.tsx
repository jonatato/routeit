import { useState, useEffect } from 'react';
import { Backpack, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import { fetchChecklist } from '../../services/bag';
import { getCategoryForItem } from '../../data/bagCategories';

interface BagSummaryWidgetProps {
  itineraryId: string;
  userId: string;
}

interface CategoryProgress {
  name: string;
  icon: string;
  pending: number;
}

export function BagSummaryWidget({ itineraryId, userId }: BagSummaryWidgetProps) {
  const [totalItems, setTotalItems] = useState(0);
  const [checkedItems, setCheckedItems] = useState(0);
  const [pendingCategories, setPendingCategories] = useState<CategoryProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBagProgress();
  }, [userId]);

  const loadBagProgress = async () => {
    try {
      setLoading(true);
      
      const data = await fetchChecklist();

      if (data) {
        const total = data.length;
        const checked = data.filter(item => item.checked).length;
        
        setTotalItems(total);
        setCheckedItems(checked);

        // Group by category using tags
        const categoryMap = new Map<string, { total: number; pending: number; name: string; emoji: string }>();
        
        data.forEach(item => {
          const category = getCategoryForItem(item.tags);
          const catId = category.id;
          
          if (!categoryMap.has(catId)) {
            categoryMap.set(catId, { 
              total: 0, 
              pending: 0,
              name: category.name,
              emoji: category.emoji,
            });
          }
          const stats = categoryMap.get(catId)!;
          stats.total++;
          if (!item.checked) stats.pending++;
        });

        // Get top 3 categories with most pending items
        const pending = Array.from(categoryMap.values())
          .filter(stats => stats.pending > 0)
          .sort((a, b) => b.pending - a.pending)
          .slice(0, 3)
          .map(stats => ({
            name: stats.name,
            icon: stats.emoji,
            pending: stats.pending,
          }));

        setPendingCategories(pending);
      }
    } catch (error) {
      console.error('Error loading bag progress:', error);
    } finally {
      setLoading(false);
    }
  };


  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const handleViewFullList = () => {
    navigate('/app/bag');
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
            <div className="h-8 w-full rounded bg-muted" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-6 w-full rounded bg-muted" />
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
          <span className="text-lg">🎒</span>
          Mi Maleta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
          <div className="text-2xl font-bold text-foreground">
            {checkedItems} / {totalItems}
          </div>
          <div className="text-xs text-muted-foreground">objetos preparados</div>
        </div>

        {/* Pending Categories */}
        {pendingCategories.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              Categorías pendientes:
            </div>
            <div className="space-y-2">
              {pendingCategories.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-2 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm text-foreground">{cat.name}</span>
                  </div>
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    {cat.pending} {cat.pending === 1 ? 'objeto' : 'objetos'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Done State */}
        {totalItems > 0 && checkedItems === totalItems && (
          <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-950/20">
            <div className="mb-1 text-2xl">✅</div>
            <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              ¡Todo listo!
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-500">
              Tienes todo preparado para el viaje
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalItems === 0 && (
          <div className="py-6 text-center">
            <div className="mb-2 text-4xl">🎒</div>
            <div className="text-sm text-muted-foreground">
              Aún no has añadido objetos
            </div>
          </div>
        )}

        {/* View Full List Button */}
        {totalItems > 0 && (
          <button
            onClick={handleViewFullList}
            className="flex w-full items-center justify-center gap-1 text-sm text-primary transition-colors hover:underline"
          >
            Ver checklist completo
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}
