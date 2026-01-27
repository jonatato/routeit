import { useEffect } from 'react';
import { syncPendingChanges, getSyncStatus } from '../services/offline';

export function useOfflineSync() {
  useEffect(() => {
    const sync = async () => {
      if (getSyncStatus() === 'online') {
        await syncPendingChanges();
      }
    };

    // Sync on mount
    sync();

    // Sync periodically when online
    const interval = setInterval(() => {
      if (getSyncStatus() === 'online') {
        sync();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);
}
