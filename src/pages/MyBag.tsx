import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { allBagItems } from '../data/bagItems';
import { BAG_CATEGORIES, getCategoryForItem } from '../data/bagCategories';
import { addChecklistItem, deleteChecklistItem, fetchChecklist, updateChecklistItem } from '../services/bag';
import { ProgressCard } from '../components/bag/ProgressCard';
import { CategorySection } from '../components/bag/CategorySection';
import { AddItemsModal } from '../components/bag/AddItemsModal';
import FullscreenLoader from '../components/FullscreenLoader';

function MyBag() {
  const [isLoading, setIsLoading] = useState(true);
  const [checklistItems, setChecklistItems] = useState<Array<{ id: string; name: string; checked: boolean; tags: string[] }>>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadChecklist = async () => {
      const data = await fetchChecklist();
      if (!isActive) return;
      setChecklistItems(data);
      setIsLoading(false);
    };

    void loadChecklist();

    return () => {
      isActive = false;
    };
  }, []);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped = new Map<string, typeof checklistItems>();

    BAG_CATEGORIES.forEach(category => {
      grouped.set(category.id, []);
    });

    checklistItems.forEach(item => {
      const category = getCategoryForItem(item.tags);
      if (!grouped.has(category.id)) {
        grouped.set(category.id, []);
      }
      grouped.get(category.id)!.push(item);
      });

    return grouped;
  }, [checklistItems]);

  // Stats
  const totalItems = checklistItems.length;
  const completedItems = checklistItems.filter(item => item.checked).length;

  const handleAddToChecklist = async (item: typeof allBagItems[number]) => {
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
    return <FullscreenLoader message="Cargando maleta..." />;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 pb-24 md:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/app" aria-label="Volver">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              Mi Maleta
            </h1>
            <p className="text-sm text-mutedForeground">Organiza tu equipaje por categorías</p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <ProgressCard totalItems={totalItems} completedItems={completedItems} />

      {/* Empty State */}
      {totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="text-8xl mb-4">🧳</div>
          <h2 className="text-2xl font-bold">Tu maleta está vacía</h2>
          <p className="text-muted-foreground max-w-md">
            Comienza a añadir items para organizar tu equipaje de viaje
          </p>
          <Button onClick={() => setShowAddModal(true)} size="lg" className="mt-4">
            <Plus className="h-5 w-5 mr-2" />
            Añadir Items
                  </Button>
                </div>
      ) : (
        <>
          {/* Categories */}
          <div className="space-y-4">
            {BAG_CATEGORIES.map(category => (
              <CategorySection
                key={category.id}
                category={category}
                items={itemsByCategory.get(category.id) || []}
                onToggleCheck={handleToggleCheck}
                onDelete={handleDelete}
                allBagItems={allBagItems}
              />
            ))}
          </div>
        </>
      )}

      {/* Floating Add Button */}
      {totalItems > 0 && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 hover:shadow-2xl"
          aria-label="Añadir items"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Add Items Modal */}
      <AddItemsModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        availableItems={allBagItems}
        checklistItemNames={checklistItems.map(item => item.name)}
        onAddItem={handleAddToChecklist}
      />
    </div>
  );
}

export default MyBag;
