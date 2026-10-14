type LeadRecord = Record<string, unknown>;

const jsonHeaders = { 'Content-Type': 'application/json' };

function response(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function text(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sì' : 'No';
  return String(value);
}

function euro(value: unknown): string {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
    : String(value);
}

function dateTime(value: unknown): string {
  if (typeof value !== 'string' || !value) return new Date().toLocaleString('it-IT');
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
}

function row(label: string, value: unknown): string {
  return '<tr><th align="left" valign="top" style="padding:9px 12px;border-bottom:1px solid #e7ece7;color:#58645b;font-size:13px;font-weight:600;width:36%">' +
    escapeHtml(label) +
    '</th><td style="padding:9px 12px;border-bottom:1px solid #e7ece7;color:#1d2b20;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere">' +
    escapeHtml(text(value)) +
    '</td></tr>';
}

function notificationFor(table: string, record: LeadRecord): { subject: string; title: string; rows: string } | null {
  if (table === 'contact_requests') {
    if (record.privacy_consent !== true) return null;
    return {
      subject: 'Nuova richiesta dal sito Casadibari',
      title: 'Nuova richiesta di contatto',
      rows: [
        row('Data', dateTime(record.created_at)),
        row('Nome', record.name),
        row('Email', record.email),
        row('Telefono', record.phone),
        row('Oggetto', record.subject),
        row('Messaggio', record.message),
      ].join(''),
    };
  }

  if (table === 'valuation_requests') {
    if (record.privacy_consent !== true) return null;
    return {
      subject: 'Nuova richiesta di valutazione | Casadibari',
      title: 'Nuova richiesta di valutazione immobiliare',
      rows: [
        row('Data', dateTime(record.created_at)),
        row('Nome', [record.first_name, record.last_name].filter(Boolean).join(' ')),
        row('Email', record.email),
        row('Telefono', record.phone),
        row('Indirizzo immobile', record.address),
        row('Tipologia', record.property_type),
        row('Superficie', record.area_sqm == null ? '—' : String(record.area_sqm) + ' m²'),
        row('Messaggio', record.message),
      ].join(''),
    };
  }

  if (table === 'property_alerts') {
    if (record.consent !== true || record.active === false) return null;
    return {
      subject: 'Nuova iscrizione agli avvisi immobiliari | Casadibari',
      title: 'Nuova ricerca immobiliare salvata',
      rows: [
        row('Data', dateTime(record.created_at)),
        row('Email cliente', record.email),
        row('Operazione', record.transaction_type),
        row('Tipologia immobile', record.property_type || 'Qualsiasi'),
        row('Zona / città', record.city || 'Qualsiasi'),
        row('Prezzo minimo', euro(record.min_price)),
        row('Prezzo massimo', euro(record.max_price)),
        row('Superficie minima', record.min_area == null ? '—' : String(record.min_area) + ' m²'),
        row('Superficie massima', record.max_area == null ? '—' : String(record.max_area) + ' m²'),
        row('Locali minimi', record.min_rooms),
        row('Consenso agli avvisi', record.consent),
      ].join(''),
    };
  }

  return null;
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return response({ error: 'Metodo non consentito.' }, 405);

  const expectedSecret = Deno.env.get('NOTIFICATION_WEBHOOK_SECRET');
  if (!expectedSecret || request.headers.get('x-hook-secret') !== expectedSecret) {
    return response({ error: 'Non autorizzato.' }, 401);
  }

  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
  const officeEmail = Deno.env.get('OFFICE_NOTIFICATION_EMAIL');
  if (!resendKey || !fromEmail || !officeEmail) {
    return response({ error: 'Il servizio di notifica email non è configurato completamente.' }, 500);
  }

  let payload: {
    type?: string;
    schema?: string;
    table?: string;
    record?: LeadRecord | null;
  };
  try {
    payload = await request.json();
  } catch {
    return response({ error: 'Payload webhook non valido.' }, 400);
  }

  if (payload.type !== 'INSERT' || payload.schema !== 'public' || !payload.record) {
    return response({ skipped: true, reason: 'Evento non gestito.' });
  }

  const table = String(payload.table || '');
  const notification = notificationFor(table, payload.record);
  if (!notification) {
    if (['contact_requests', 'valuation_requests', 'property_alerts'].includes(table)) {
      return response({ skipped: true, reason: 'Consenso assente o evento non applicabile.' });
    }
    return response({ error: 'Tabella non gestita.' }, 400);
  }

  const html =
    '<div style="font-family:Arial,sans-serif;color:#1d2b20;max-width:680px;margin:auto">' +
    '<div style="background:#f2f8f1;padding:24px;border-radius:12px 12px 0 0">' +
    '<div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#27833a;font-weight:bold">Casadibari Immobiliare</div>' +
    '<h1 style="font-size:24px;line-height:1.3;margin:10px 0 0">' + escapeHtml(notification.title) + '</h1>' +
    '</div><p style="font-size:14px;line-height:1.6;margin:20px 0">È stata ricevuta una nuova compilazione dal sito. I dati sono stati registrati nel database Supabase.</p>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #e7ece7">' +
    notification.rows +
    '</table><p style="margin-top:20px;font-size:12px;color:#657067">Notifica automatica del sito Casadibari Immobiliare.</p></div>';

  const result = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromEmail,
      to: [officeEmail],
      subject: notification.subject,
      html,
    }),
  });

  if (!result.ok) {
    const details = (await result.text()).slice(0, 500);
    console.error('Invio notifica ufficio fallito:', result.status, details);
    return response({ error: 'Invio email non riuscito.', providerStatus: result.status }, 502);
  }

  return response({ success: true });
});
