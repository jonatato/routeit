export type DestinationKey = 'today' | 'plan' | 'money' | 'more';

export type Destination = {
  key: DestinationKey;
  label: string;
  path: string;
};

export const DESTINATIONS: Destination[] = [
  { key: 'today', label: 'Hoy', path: '' },
  { key: 'plan', label: 'Plan', path: '/plan' },
  { key: 'money', label: 'Dinero', path: '/money' },
  { key: 'more', label: 'Más', path: '/more' },
];

const MORE_PREFIXES = ['/documents', '/bag', '/itineraries', '/profile', '/share', '/more'];

export function destinationHref(base: '/app' | '/preview', key: DestinationKey) {
  const destination = DESTINATIONS.find(item => item.key === key);
  return `${base}${destination?.path ?? ''}`;
}

export function activeDestination(pathname: string): DestinationKey {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path.endsWith('/plan') || path.includes('/plan/')) return 'plan';
  if (path.endsWith('/money') || path.includes('/money')) return 'money';
  if (MORE_PREFIXES.some(prefix => path.includes(prefix))) return 'more';
  return 'today';
}

export const RETIRED_REDIRECTS: Record<string, string> = {
  '/app/today': '/app',
  '/app/memories': '/app',
  '/app/analytics': '/app',
  '/app/store': '/app/more',
  '/app/admin': '/app/plan',
  '/app/admin/sections': '/app/plan',
  '/app/search': '/app/plan',
  '/app/split': '/app/money',
  '/store': '/pricing',
};

export function redirectFor(pathname: string) {
  return RETIRED_REDIRECTS[pathname] ?? null;
}
