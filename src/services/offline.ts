import { db, type PendingSync } from '../db/indexedDB';

export type SyncStatus = 'online' | 'offline' | 'syncing';

let syncStatus: SyncStatus = navigator.onLine ? 'online' : 'offline';

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function setSyncStatus(status: SyncStatus) {
  syncStatus = status;
}

// Listen to online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setSyncStatus('online');
    syncPendingChanges();
  });
  window.addEventListener('offline', () => {
    setSyncStatus('offline');
  });
}

export async function cacheItinerary(itineraryId: string, userId: string, data: any) {
  await db.itineraries.put({
    itinerary_id: itineraryId,
    user_id: userId,
    data,
    updated_at: new Date().toISOString(),
  });
}

export async function getCachedItinerary(itineraryId: string): Promise<any | null> {
  const cached = await db.itineraries.where('itinerary_id').equals(itineraryId).first();
  return cached?.data || null;
}

export async function cacheSplit(groupId: string, data: any) {
  await db.splits.put({
    group_id: groupId,
    data,
    updated_at: new Date().toISOString(),
  });
}

export async function getCachedSplit(groupId: string): Promise<any | null> {
  const cached = await db.splits.where('group_id').equals(groupId).first();
  return cached?.data || null;
}

export async function addPendingSync(type: PendingSync['type'], action: PendingSync['action'], data: any) {
  await db.pendingSyncs.add({
    type,
    action,
    data,
    created_at: new Date().toISOString(),
  });
}

export async function getPendingSyncs(): Promise<PendingSync[]> {
  return await db.pendingSyncs.orderBy('created_at').toArray();
}

export async function removePendingSync(id: number | string) {
  await db.pendingSyncs.delete(Number(id));
}

export async function syncPendingChanges() {
  if (getSyncStatus() !== 'online') return;

  setSyncStatus('syncing');
  const pending = await getPendingSyncs();

  for (const sync of pending) {
    try {
      // Implement sync logic based on type and action
      // This is a simplified version - you'd need to implement actual sync logic
      // for each type (itinerary, split, expense, payment)
      
      // Example for itinerary updates:
      if (sync.type === 'itinerary' && sync.action === 'update') {
        // Sync itinerary update
        // await supabase.from('itineraries').update(sync.data).eq('id', sync.data.id);
      }

      if (sync.id) {
        await removePendingSync(sync.id);
      }
    } catch (error) {
      console.error('Error syncing pending change:', error);
      // Keep the sync in queue for retry
    }
  }

  setSyncStatus('online');
}
