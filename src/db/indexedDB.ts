import Dexie, { type Table } from 'dexie';

export interface ItineraryCache {
  id?: string;
  itinerary_id: string;
  user_id: string;
  data: any;
  updated_at: string;
}

export interface SplitCache {
  id?: string;
  group_id: string;
  data: any;
  updated_at: string;
}

export interface PendingSync {
  id?: string;
  type: 'itinerary' | 'split' | 'expense' | 'payment';
  action: 'create' | 'update' | 'delete';
  data: any;
  created_at: string;
}

class RouteItDB extends Dexie {
  itineraries!: Table<ItineraryCache>;
  splits!: Table<SplitCache>;
  pendingSyncs!: Table<PendingSync>;

  constructor() {
    super('RouteItDB');
    this.version(1).stores({
      itineraries: '++id, itinerary_id, user_id, updated_at',
      splits: '++id, group_id, updated_at',
      pendingSyncs: '++id, type, action, created_at',
    });
  }
}

export const db = new RouteItDB();
