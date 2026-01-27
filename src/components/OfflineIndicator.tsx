import { useEffect, useState } from 'react';
import { WifiOff, Loader2 } from 'lucide-react';
import { getSyncStatus, type SyncStatus } from '../services/offline';

export function OfflineIndicator() {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(getSyncStatus());
    };

    // Check status periodically
    const interval = setInterval(updateStatus, 1000);
    updateStatus();

    return () => clearInterval(interval);
  }, []);

  if (status === 'online') return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 flex justify-center px-4 md:bottom-4">
      <div
        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
          status === 'offline'
            ? 'border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
            : 'border-purple-500 bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
        }`}
      >
        {status === 'offline' ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Sin conexión - Los cambios se guardarán localmente</span>
          </>
        ) : (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sincronizando cambios...</span>
          </>
        )}
      </div>
    </div>
  );
}
