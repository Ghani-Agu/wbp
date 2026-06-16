// Email delivery. Uses Resend when RESEND_API_KEY + EMAIL_FROM are set; otherwise
// falls back to a "disk outbox" so the app builds, previews and the full opt-in /
// campaign flow works locally without any live keys.
// NOTE: server-only module — only import from server actions / route handlers.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'World Business Plus <onboarding@resend.dev>';

export function emailConfigured() {
  return Boolean(RESEND_API_KEY);
}

// Absolute site origin for links/pixels inside emails.
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

async function writeToOutbox({ to, subject, html }) {
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const dir = path.join(process.cwd(), '.email-outbox');
    await fs.mkdir(dir, { recursive: true });
    const safe = String(to).replace(/[^a-z0-9@._-]/gi, '_');
    const file = path.join(dir, `${Date.now()}-${safe}.html`);
    await fs.writeFile(file, `<!-- to:${to} | subject:${subject} -->\n${html}`, 'utf8');
    console.log(`[email:dev-outbox] wrote ${file}  (subject: ${subject})`);
    return file;
  } catch (e) {
    // Read-only FS (e.g. serverless) — just log so the flow still completes.
    console.log(`[email:dev-outbox] (no write) to:${to} subject:${subject} — ${e?.message}`);
    return null;
  }
}

/**
 * sendEmail({ to, subject, html, headers })
 * Returns { ok, id?, dev?, file?, error? }.
 */
export async function sendEmail({ to, subject, html, headers }) {
  if (!to || !subject || !html) return { ok: false, error: 'missing to/subject/html' };

  if (!emailConfigured()) {
    const file = await writeToOutbox({ to, subject, html });
    return { ok: true, dev: true, file };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html, headers }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.message || `resend ${res.status}` };
    return { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, error: e?.message || 'send failed' };
  }
}
