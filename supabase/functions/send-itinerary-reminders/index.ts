import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

type ItineraryRow = {
  id: string;
  user_id: string;
  title: string;
  date_range: string | null;
  days?: Array<{ date_text: string }>;
  flights?: Array<{ date_text: string }>;
  itinerary_collaborators?: Array<{ user_id: string; role: string }>;
};

type ListRow = {
  itinerary_id: string;
  section_key: string;
  itinerary_list_items?: Array<{ text: string; order_index: number }>;
};

type PreferencesRow = {
  user_id: string;
  email_notifications: boolean | null;
};

type BagItemRow = {
  user_id: string;
  name: string;
  checked: boolean;
};

const monthMap: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dic: 11,
  jan: 0,
  febr: 1,
  apr: 3,
  aug: 7,
  dec: 11,
};

const stripWeekdayPrefix = (value: string) => value.replace(/^[A-Za-z]{2,},?\s+/u, '').trim();

const parseItineraryDate = (raw: string): Date | null => {
  if (!raw) return null;
  const value = stripWeekdayPrefix(raw).trim().toLowerCase();

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const slashMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    return new Date(Number(slashMatch[3]), Number(slashMatch[2]) - 1, Number(slashMatch[1]));
  }

  const spanishMatch = value.match(/(\d{1,2})\s+de\s+([a-z]+)\s+(\d{4})/);
  if (spanishMatch) {
    const month = monthMap[spanishMatch[2]];
    if (month !== undefined) {
      return new Date(Number(spanishMatch[3]), month, Number(spanishMatch[1]));
    }
  }

  const shortMatch = value.match(/(\d{1,2})\s+([a-z]{3,})\s+(\d{4})/);
  if (shortMatch) {
    const month = monthMap[shortMatch[2]];
    if (month !== undefined) {
      return new Date(Number(shortMatch[3]), month, Number(shortMatch[1]));
    }
  }

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed);
  }

  return null;
};

const parseDateRangeStart = (dateRange: string | null) => {
  if (!dateRange) return null;
  const patterns = [
    /\d{4}-\d{2}-\d{2}/,
    /\d{1,2}\/\d{1,2}\/\d{4}/,
    /\d{1,2}\s+de\s+[A-Za-z]+\s+\d{4}/,
    /\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}/,
  ];
  for (const pattern of patterns) {
    const match = dateRange.match(pattern);
    if (match) {
      const parsed = parseItineraryDate(match[0]);
      if (parsed) return parsed;
    }
  }
  return null;
};

const parseISODate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getEarliestDate = (dates: Array<Date | null>) => {
  const valid = dates.filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime()));
  if (valid.length === 0) return null;
  valid.sort((a, b) => a.getTime() - b.getTime());
  return valid[0];
};

const getItineraryStartDate = (itinerary: ItineraryRow) => {
  const dayDates = (itinerary.days ?? []).map(day => parseItineraryDate(day.date_text));
  const earliestDay = getEarliestDate(dayDates);
  if (earliestDay) return earliestDay;

  const flightDates = (itinerary.flights ?? []).map(flight => parseItineraryDate(flight.date_text));
  const earliestFlight = getEarliestDate(flightDates);
  if (earliestFlight) return earliestFlight;

  return parseDateRangeStart(itinerary.date_range ?? null);
};

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const buildEmailHtml = (title: string, startDate: Date, checklist: string[], bagChecklist: string[]) => {
  const dateLabel = startDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const listItems = checklist.length > 0
    ? checklist.map(item => `<li>${item}</li>`).join('')
    : '<li>No hay elementos de checklist en el itinerario.</li>';
  const bagItems = bagChecklist.length > 0
    ? bagChecklist.map(item => `<li>${item}</li>`).join('')
    : '<li>No hay elementos en tu checklist personal.</li>';

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Tu viaje ${title} comienza en 7 dias</h2>
      <p>Fecha de inicio: <strong>${dateLabel}</strong></p>
      <h3>Checklist del itinerario</h3>
      <ul>${listItems}</ul>
      <h3>Checklist personal</h3>
      <ul>${bagItems}</ul>
      <p>Entra en tu itinerario para revisar el dia a dia.</p>
    </div>
  `;
};

const sendEmail = async (apiKey: string, from: string, to: string, subject: string, html: string) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Email send failed');
  }
};

const handler = async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
    const fromEmail = Deno.env.get('REMINDER_FROM_EMAIL') ?? '';
    const testRecipient = Deno.env.get('REMINDER_TEST_RECIPIENT') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase config' }), { status: 500 });
    }

    if (!resendKey || !fromEmail) {
      return new Response(JSON.stringify({ error: 'Missing email config' }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    let overrideToday: Date | null = null;
    try {
      const url = new URL(req.url);
      const queryToday = url.searchParams.get('today');
      if (queryToday) {
        overrideToday = parseISODate(queryToday);
      }
      if (!overrideToday && req.method !== 'GET') {
        const contentType = req.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const body = await req.json();
          if (body && typeof body.today === 'string') {
            overrideToday = parseISODate(body.today);
          }
        }
      }
    } catch {
      overrideToday = null;
    }

  const { data: itineraries, error: itineraryError } = await supabase
    .from('itineraries')
    .select('id, user_id, title, date_range, days(date_text), flights(date_text), itinerary_collaborators(user_id, role)');

  if (itineraryError || !itineraries) {
    return new Response(JSON.stringify({ error: itineraryError?.message ?? 'Failed to load itineraries' }), { status: 500 });
  }

  const { data: packingLists } = await supabase
    .from('itinerary_lists')
    .select('itinerary_id, section_key, itinerary_list_items(text, order_index)')
    .eq('section_key', 'packing');

  const packingByItinerary = new Map<string, string[]>();
  (packingLists as ListRow[] | null)?.forEach(list => {
    const items = (list.itinerary_list_items ?? [])
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map(item => item.text);
    packingByItinerary.set(list.itinerary_id, items);
  });

  const userIds = new Set<string>();
  (itineraries as ItineraryRow[]).forEach(itinerary => {
    userIds.add(itinerary.user_id);
    (itinerary.itinerary_collaborators ?? []).forEach(collab => userIds.add(collab.user_id));
  });

  const userIdList = Array.from(userIds);

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('user_id, email_notifications')
    .in('user_id', userIdList);

  const prefsByUser = new Map<string, PreferencesRow>();
  (preferences as PreferencesRow[] | null)?.forEach(pref => prefsByUser.set(pref.user_id, pref));

  const { data: bagItems } = await supabase
    .from('bag_checklist_items')
    .select('user_id, name, checked')
    .in('user_id', userIdList);

  const bagByUser = new Map<string, string[]>();
  (bagItems as BagItemRow[] | null)?.forEach(item => {
    const list = bagByUser.get(item.user_id) ?? [];
    list.push(item.name);
    bagByUser.set(item.user_id, list);
  });

  const today = overrideToday ?? new Date();
  const target = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const targetKey = formatDate(target);

  const reminders: Array<{ itinerary: ItineraryRow; startDate: Date }> = [];
  (itineraries as ItineraryRow[]).forEach(itinerary => {
    const startDate = getItineraryStartDate(itinerary);
    if (!startDate) return;
    if (formatDate(startDate) === targetKey) {
      reminders.push({ itinerary, startDate });
    }
  });

  if (reminders.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  let sent = 0;

  for (const reminder of reminders) {
    const itineraryId = reminder.itinerary.id;

    const { data: alreadySent } = await supabase
      .from('itinerary_reminders')
      .select('id')
      .eq('itinerary_id', itineraryId)
      .eq('reminder_type', '7day')
      .eq('send_on', targetKey)
      .limit(1);

    if (alreadySent && alreadySent.length > 0) {
      continue;
    }

    const recipientIds = new Set<string>();
    recipientIds.add(reminder.itinerary.user_id);
    (reminder.itinerary.itinerary_collaborators ?? []).forEach(collab => recipientIds.add(collab.user_id));

    for (const userId of recipientIds) {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const email = userData.user?.email;
      if (!email) continue;

      if (testRecipient && email !== testRecipient) continue;

      const pref = prefsByUser.get(userId);
      if (pref && pref.email_notifications === false) continue;

      const checklist = packingByItinerary.get(itineraryId) ?? [];
      const bagChecklist = bagByUser.get(userId) ?? [];
      const html = buildEmailHtml(reminder.itinerary.title, reminder.startDate, checklist, bagChecklist);
      const subject = `Tu viaje empieza en 7 dias: ${reminder.itinerary.title}`;

      await sendEmail(resendKey, fromEmail, email, subject, html);
      sent += 1;
    }

    await supabase
      .from('itinerary_reminders')
      .insert({
        itinerary_id: itineraryId,
        reminder_type: '7day',
        send_on: targetKey,
        sent_at: new Date().toISOString(),
      });
  }

    return new Response(JSON.stringify({ sent }), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-itinerary-reminders failed:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

Deno.serve(handler);
