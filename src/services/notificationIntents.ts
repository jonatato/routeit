type NotificationPayload = Record<string, unknown>;

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function normalizePayload(payload: unknown): NotificationPayload {
  if (!payload || typeof payload !== 'object') return {};
  return payload as NotificationPayload;
}

function buildRouteWithOptionalId(baseRoute: string, queryKey: string, value: string | null): string {
  if (!value) return baseRoute;
  const params = new URLSearchParams({ [queryKey]: value });
  return `${baseRoute}?${params.toString()}`;
}

export function resolveRouteFromNotificationPayload(payload: unknown): string | null {
  const normalized = normalizePayload(payload);

  const explicitRoute = asString(normalized.route);
  if (explicitRoute?.startsWith('/')) {
    return explicitRoute;
  }

  const itineraryId = asString(normalized.itineraryId) ?? asString(normalized.itinerary_id);
  const groupId = asString(normalized.groupId) ?? asString(normalized.group_id);
  const intent = asString(normalized.intent);
  const type = asString(normalized.type);

  if (intent === 'today') {
    return buildRouteWithOptionalId('/app/today', 'itineraryId', itineraryId);
  }

  if (intent === 'split') {
    return buildRouteWithOptionalId('/app/split', 'groupId', groupId);
  }

  if (intent === 'itinerary') {
    return buildRouteWithOptionalId('/app', 'itineraryId', itineraryId);
  }

  if (type === 'splitwise' || groupId) {
    return buildRouteWithOptionalId('/app/split', 'groupId', groupId);
  }

  if (type === 'itinerary' || itineraryId) {
    return buildRouteWithOptionalId('/app/today', 'itineraryId', itineraryId);
  }

  return null;
}
