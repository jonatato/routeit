import { useState, useEffect, type ComponentType } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExpenseSummaryWidget } from './widgets/ExpenseSummaryWidget';
import { TravelChecklistWidget } from './widgets/TravelChecklistWidget';
import { CollaboratorsWidget } from './widgets/CollaboratorsWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import { LocationsMapWidget } from './widgets/LocationsMapWidget';
import { BagSummaryWidget } from './widgets/BagSummaryWidget';
import { UsefulTipsWidget } from './widgets/UsefulTipsWidget';
import { DocumentsWidget } from './widgets/DocumentsWidget';
import { PhrasesWidget } from './widgets/PhrasesWidget';
import { StatsWidget } from './widgets/StatsWidget';
import { EmergencyWidget } from './widgets/EmergencyWidget';
import type { WidgetPref } from '../services/widgets';

type WidgetStateItem = {
  key: string;
  Component: ComponentType<Record<string, unknown>>;
  props: Record<string, unknown>;
  order: number;
  is_visible: boolean;
  is_collapsed: boolean;
  is_pinned: boolean;
  settings?: Record<string, unknown>;
};

function WidgetsSidebar() {
  const [searchParams] = useSearchParams();
  const itineraryId = searchParams.get('itineraryId');
  const [widgetsState, setWidgetsState] = useState<WidgetStateItem[] | null>(null);

  useEffect(() => {
    (async () => {
      if (!itineraryId) return;

      // Default widgets configuration (keys + default props)
      const defaults = [
        { key: 'expense_summary', component: ExpenseSummaryWidget, props: { itineraryId, currentUserId: '' } },
        { key: 'checklist', component: TravelChecklistWidget, props: { itineraryId, userId: '' } },
        { key: 'collaborators', component: CollaboratorsWidget, props: { itineraryId, currentUserId: '' } },
        { key: 'weather', component: WeatherWidget, props: { city: 'Beijing', countryCode: 'CN' } },
        { key: 'locations_map', component: LocationsMapWidget, props: { locations: [], onViewFullMap: () => {} } },
        { key: 'bag_summary', component: BagSummaryWidget, props: { itineraryId, userId: '' } },
        { key: 'useful_tips', component: UsefulTipsWidget, props: { country: 'China', currency: 'CNY', exchangeRate: 7.85, timezone: 'UTC+8', timezoneOffset: '+6h respecto a España', plugType: 'A, I', voltage: '220V' } },
        { key: 'documents', component: DocumentsWidget, props: { documents: [] } },
        { key: 'phrases', component: PhrasesWidget, props: { phrases: [] } },
        { key: 'stats', component: StatsWidget, props: { itinerary: { id: itineraryId, title: '', dateRange: '', intro: '', locations: [], days: [], flights: { outbound: { date: '', fromCity: '', fromTime: '', toCity: '', toTime: '', duration: '', stops: '' }, inbound: { date: '', fromCity: '', fromTime: '', toCity: '', toTime: '', duration: '', stops: '' } }, foods: [], tips: [], avoid: [], budgetTiers: [] }, totalSpent: 0, estimatedBudget: 2500 } },
        { key: 'emergency', component: EmergencyWidget, props: { country: 'China', embassyPhone: '+86 10 6532 3629', embassyAddress: 'Sanlitun, Chaoyang, Beijing', insurancePhone: '+34 900 123 456', insurancePolicy: 'TS-2026-12345' } },
      ];

      // Lazy-load user prefs & current user
      const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());
      const userId = user?.id ?? null;

      const { fetchUserWidgetPreferences } = await import('../services/widgets');
      const prefs = await fetchUserWidgetPreferences(itineraryId);

      // Map defaults into internal state
      let state = defaults.map((d, idx) => ({
        key: d.key,
        Component: d.component,
        props: { ...d.props, currentUserId: userId },
        order: idx,
        is_visible: true,
        is_collapsed: false,
        is_pinned: false,
      }));

      if (prefs && prefs.length > 0) {
        // Merge prefs: visibility/order/pinned/collapsed/settings
        const prefsByKey = Object.fromEntries((prefs as WidgetPref[]).map((p) => [p.widget_key, p]));
        state = state
          .map(s => ({ ...s, ...(prefsByKey[s.key] ? { order: prefsByKey[s.key].order_index, is_visible: prefsByKey[s.key].is_visible, is_collapsed: prefsByKey[s.key].is_collapsed, is_pinned: prefsByKey[s.key].is_pinned, settings: prefsByKey[s.key].settings } : {}) }))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }

      setWidgetsState(state);
    })();
  }, [itineraryId]);

  const savePrefs = async (nextState: WidgetStateItem[]) => {
    setWidgetsState(nextState);
    const { saveUserWidgetPreferences } = await import('../services/widgets');
    const prefs = nextState.map((w, idx) => ({ widget_key: w.key, order_index: idx, is_visible: !!w.is_visible, is_pinned: !!w.is_pinned, is_collapsed: !!w.is_collapsed, settings: w.settings ?? {} }));
    await saveUserWidgetPreferences(prefs, itineraryId);
  };

  const move = (index: number, dir: -1 | 1) => {
    if (!widgetsState) return;
    const next = [...widgetsState];
    const swapIdx = index + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    // Reindex order
    awaitSave(next);
  };

  const awaitSave = (next: WidgetStateItem[]) => {
    // Reassign indexes and save
    next.forEach((n, i) => (n.order = i));
    savePrefs(next);
  };

  const toggleVisibility = (index: number) => {
    if (!widgetsState) return;
    const next = [...widgetsState];
    next[index].is_visible = !next[index].is_visible;
    awaitSave(next);
  };

  const toggleCollapse = (index: number) => {
    if (!widgetsState) return;
    const next = [...widgetsState];
    next[index].is_collapsed = !next[index].is_collapsed;
    awaitSave(next);
  };

  if (!itineraryId) return null;

  if (!widgetsState) {
    return (
      <aside className="hidden w-96 shrink-0 flex-col border-l border-border bg-muted/40 px-4 py-6 md:flex overflow-y-auto h-screen sticky top-0 space-y-4">
        <h2 className="text-lg font-semibold text-foreground mb-2">Widgets</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-3/4 rounded bg-muted" />
          <div className="h-28 rounded bg-muted" />
          <div className="h-28 rounded bg-muted" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-96 shrink-0 flex-col border-l border-border bg-muted/40 px-4 py-6 md:flex sticky top-0 space-y-4">
      <h2 className="text-lg font-semibold text-foreground mb-2">Widgets</h2>

      {widgetsState.map((w, idx) => (
        w.is_visible && (
          <div key={w.key} className="rounded-lg border border-border bg-muted/30 p-2 transition-colors hover:bg-muted/50">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-sm font-semibold">{w.key.replaceAll('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => move(idx, -1)} className="text-xs px-2 py-1 rounded hover:bg-muted/50">↑</button>
                <button onClick={() => move(idx, 1)} className="text-xs px-2 py-1 rounded hover:bg-muted/50">↓</button>
                <button onClick={() => toggleCollapse(idx)} className="text-xs px-2 py-1 rounded hover:bg-muted/50">{w.is_collapsed ? '🔽' : '🔼'}</button>
                <button onClick={() => toggleVisibility(idx)} className="text-xs px-2 py-1 rounded hover:bg-muted/50">✕</button>
              </div>
            </div>

            {!w.is_collapsed && (
              <div>
                {/* Render component */}
                <w.Component {...w.props} />
              </div>
            )}
          </div>
        )
      ))}
    </aside>
  );
}


export default WidgetsSidebar;
