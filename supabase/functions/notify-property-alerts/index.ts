import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Alert = {
  id: string;
  email: string;
  transaction_type: string;
  property_type: string;
  city: string;
  min_price: number | null;
  max_price: number | null;
  min_area: number | null;
  max_area: number | null;
  min_rooms: number | null;
  active: boolean;
  consent: boolean;
};

type PropertyRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description_html: string;
  property_type: string;
  transaction_type: string;
  status: string;
  price: number | null;
  city: string;
  neighborhood: string;
  address: string;
  area_sqm: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  published: boolean;
  created_at: string;
  property_images?: Array<{ public_url: string; alt_text?: string; sort_order?: number }>;
};

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] || char,
  );
}

function money(value: number | null): string {
  if (value == null) return 'Prezzo su richiesta';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function locationMatches(preference: string, property: PropertyRecord): boolean {
  const query = (preference || '').trim().toLocaleLowerCase('it-IT');
  if (!query || query === 'tutte' || query === '*') return true;
  const target = [property.city, property.neighborhood, property.address]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('it-IT');
  const tokens = query
    .split(/[,;|]/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
  return tokens.some((token) => target.includes(token)) || target.includes(query);
}

function matches(alert: Alert, property: PropertyRecord): boolean {
  if (!property.published || property.status !== 'available') return false;
  if (alert.transaction_type && alert.transaction_type !== property.transaction_type) return false;
  if (alert.property_type && alert.property_type !== property.property_type) return false;
  if (!locationMatches(alert.city, property)) return false;
  if (
    alert.min_price != null &&
    (property.price == null || property.price < Number(alert.min_price))
  )
    return false;
  if (
    alert.max_price != null &&
    (property.price == null || property.price > Number(alert.max_price))
  )
    return false;
  if (
    alert.min_area != null &&
    (property.area_sqm == null || property.area_sqm < Number(alert.min_area))
  )
    return false;
  if (
    alert.max_area != null &&
    (property.area_sqm == null || property.area_sqm > Number(alert.max_area))
  )
    return false;
  if (
    alert.min_rooms != null &&
    (property.rooms == null || property.rooms < Number(alert.min_rooms))
  )
    return false;
  return true;
}

function emailHtml(listings: PropertyRecord[], baseUrl: string): string {
  const cards = listings
    .map((property) => {
      const image = property.property_images
        ?.slice()
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0]?.public_url;
      const detailsUrl =
        baseUrl.replace(/\/$/, '') + '/immobile/' + encodeURIComponent(property.slug);
      return (
        '<tr><td style="padding:0 0 22px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5ebe5;border-radius:12px;overflow:hidden"><tr>' +
        (image
          ? '<td width="150" valign="top"><img src="' +
            escapeHtml(image) +
            '" alt="" width="150" style="display:block;width:150px;height:126px;object-fit:cover"/></td>'
          : '') +
        '<td valign="top" style="padding:16px"><div style="font-size:12px;color:#328744;text-transform:uppercase;letter-spacing:1px">' +
        escapeHtml(property.transaction_type) +
        ' · ' +
        escapeHtml(property.property_type) +
        '</div>' +
        '<h2 style="font-size:17px;margin:7px 0;color:#18241b">' +
        escapeHtml(property.title) +
        '</h2><p style="margin:0 0 8px;color:#5c675f;font-size:13px">' +
        escapeHtml(property.neighborhood ? property.neighborhood + ', ' : '') +
        escapeHtml(property.city) +
        (property.area_sqm ? ' · ' + escapeHtml(property.area_sqm) + ' m²' : '') +
        (property.rooms ? ' · ' + escapeHtml(property.rooms) + ' locali' : '') +
        '</p>' +
        '<strong style="display:block;margin-bottom:12px;color:#18241b">' +
        escapeHtml(money(property.price)) +
        '</strong><a href="' +
        escapeHtml(detailsUrl) +
        '" style="display:inline-block;background:#35a94a;color:#fff;text-decoration:none;padding:10px 14px;border-radius:7px;font-size:13px;font-weight:bold">Scopri l’immobile</a></td></tr></table></td></tr>'
      );
    })
    .join('');
  return (
    '<div style="font-family:Arial,sans-serif;color:#26342a;max-width:680px;margin:auto"><div style="padding:28px 24px;background:#f4f8f3;border-radius:14px"><div style="color:#23863a;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:bold">Casadibari Immobiliare</div><h1 style="font-size:27px;line-height:1.2;margin:12px 0 8px;color:#18241b">Le proposte che corrispondono alla tua ricerca</h1><p style="margin:0;color:#526057;line-height:1.6">Abbiamo selezionato fino a tre immobili disponibili in base alle preferenze che hai salvato.</p></div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px">' +
    cards +
    '</table><p style="font-size:12px;line-height:1.6;color:#6d766f;border-top:1px solid #e5ebe5;padding-top:16px">Ricevi questa email perché hai richiesto aggiornamenti immobiliari da Casadibari. Per aggiornare o disattivare gli avvisi, contatta l’agenzia attraverso il sito.</p></div>'
  );
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const expectedSecret = Deno.env.get('NOTIFICATION_WEBHOOK_SECRET');
  if (!expectedSecret || request.headers.get('x-hook-secret') !== expectedSecret) {
    return new Response('Unauthorized', { status: 401 });
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
  const siteUrl = Deno.env.get('SITE_URL') || 'https://casadibari.altervista.org';
  if (!supabaseUrl || !serviceKey || !resendKey || !fromEmail) {
    return new Response(
      JSON.stringify({ error: 'Manca una variabile necessaria alla notifica email.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let payload: { record?: { id?: number; property_id?: string } };
  try {
    payload = await request.json();
  } catch {
    return new Response('Invalid payload', { status: 400 });
  }
  const queueId = Number(payload.record?.id);
  const propertyId = String(payload.record?.property_id || '');
  if (!queueId || !propertyId) return new Response('Missing queue record', { status: 400 });

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: queue } = await db
    .from('property_notification_queue')
    .select('id, processed')
    .eq('id', queueId)
    .maybeSingle();
  if (!queue || queue.processed)
    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const { data: eventProperty, error: eventError } = await db
      .from('properties')
      .select('*, property_images(public_url, alt_text, sort_order)')
      .eq('id', propertyId)
      .maybeSingle();
    if (
      eventError ||
      !eventProperty ||
      eventProperty.published !== true ||
      eventProperty.status !== 'available'
    ) {
      await db
        .from('property_notification_queue')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', queueId);
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Property unavailable or unpublished' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { data: alerts, error: alertsError } = await db
      .from('property_alerts')
      .select('*')
      .eq('active', true)
      .eq('consent', true);
    if (alertsError) throw alertsError;
    const { data: allProperties, error: propertiesError } = await db
      .from('properties')
      .select('*, property_images(public_url, alt_text, sort_order)')
      .eq('published', true)
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(250);
    if (propertiesError) throw propertiesError;

    let deliveredCount = 0;
    for (const rawAlert of (alerts || []) as Alert[]) {
      if (!matches(rawAlert, eventProperty as PropertyRecord)) continue;
      const { data: sentRows } = await db
        .from('property_alert_deliveries')
        .select('property_id')
        .eq('alert_id', rawAlert.id);
      const alreadySent = new Set((sentRows || []).map((row) => row.property_id));
      const candidates = ((allProperties || []) as PropertyRecord[])
        .filter((property) => matches(rawAlert, property) && !alreadySent.has(property.id))
        .sort(
          (a, b) =>
            Number(b.id === propertyId) - Number(a.id === propertyId) ||
            String(b.created_at).localeCompare(String(a.created_at)),
        )
        .slice(0, 3);
      if (!candidates.length) continue;

      const result = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: [rawAlert.email],
          subject:
            candidates.length === 1
              ? 'Una nuova proposta per la tua ricerca | Casadibari'
              : candidates.length + ' proposte per la tua ricerca | Casadibari',
          html: emailHtml(candidates, siteUrl),
        }),
      });
      if (!result.ok) {
        const errorBody = await result.text();
        throw new Error(
          'Invio email non riuscito: ' + result.status + ' ' + errorBody.slice(0, 300),
        );
      }
      const rows = candidates.map((property) => ({
        alert_id: rawAlert.id,
        property_id: property.id,
      }));
      const { error: insertError } = await db.from('property_alert_deliveries').insert(rows);
      if (insertError) throw insertError;
      await db
        .from('property_alerts')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('id', rawAlert.id);
      deliveredCount += 1;
    }

    await db
      .from('property_notification_queue')
      .update({ processed: true, error: '', processed_at: new Date().toISOString() })
      .eq('id', queueId);
    return new Response(JSON.stringify({ success: true, notificationsSent: deliveredCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore sconosciuto';
    await db
      .from('property_notification_queue')
      .update({
        processed: true,
        error: message.slice(0, 1000),
        processed_at: new Date().toISOString(),
      })
      .eq('id', queueId);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
