// Branded, reusable WBP email template (inline styles for email-client support).
import { siteUrl } from '@/lib/email/send';

const ACCENT = '#FF5A1F';
const INK = '#16120E';
const MUTED = '#6E655C';
const LINE = '#ece8e2';

const COPY = {
  fr: { tagline: 'Sécurité · Réseaux · Affichage', why: 'Vous recevez cet e-mail car vous êtes inscrit à la newsletter de World Business Plus.', unsub: 'Se désinscrire', agreed: 'Distributeur agréé par l’État — Alger, Algérie' },
  en: { tagline: 'Security · Networks · Displays', why: 'You are receiving this because you subscribed to the World Business Plus newsletter.', unsub: 'Unsubscribe', agreed: 'State-approved distributor — Algiers, Algeria' },
  ar: { tagline: 'الأمن · الشبكات · العرض', why: 'تتلقى هذا البريد لأنك مشترك في نشرة World Business Plus.', unsub: 'إلغاء الاشتراك', agreed: 'موزّع معتمد من الدولة — الجزائر العاصمة' },
};

/** Full branded wrapper around arbitrary inner HTML. */
export function wrapEmail({ title = 'World Business Plus', preheader = '', bodyHtml = '', unsubscribeUrl = '', lang = 'fr' } = {}) {
  const c = COPY[lang] || COPY.fr;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const site = siteUrl();
  const pre = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>`
    : '';
  const unsub = unsubscribeUrl
    ? `<a href="${unsubscribeUrl}" style="color:${MUTED};text-decoration:underline">${c.unsub}</a>`
    : '';
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f1ec;font-family:Arial,Helvetica,sans-serif;color:${INK}">
${pre}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:16px;overflow:hidden">
      <tr><td style="padding:22px 28px;border-bottom:1px solid ${LINE}">
        <table role="presentation" width="100%"><tr>
          <td align="${dir === 'rtl' ? 'right' : 'left'}">
            <span style="display:inline-block;width:30px;height:30px;background:${ACCENT};color:#fff;border-radius:8px;text-align:center;line-height:30px;font-weight:bold;vertical-align:middle">W</span>
            <span style="font-weight:bold;font-size:16px;vertical-align:middle;padding:0 8px">World Business Plus</span>
          </td>
          <td align="${dir === 'rtl' ? 'left' : 'right'}" style="color:${ACCENT};font-size:11px;letter-spacing:.04em;text-transform:uppercase">${c.tagline}</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px;font-size:15px;line-height:1.6;color:${INK}">${bodyHtml}</td></tr>
      <tr><td style="padding:20px 28px;border-top:1px solid ${LINE};background:#faf8f5;font-size:12px;color:${MUTED};line-height:1.6">
        <div>${c.why}</div>
        <div style="margin-top:6px">${unsub}${unsub ? ' · ' : ''}<a href="${site}" style="color:${MUTED};text-decoration:underline">${site.replace(/^https?:\/\//, '')}</a></div>
        <div style="margin-top:6px;color:#9a9087">${c.agreed}</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/** A primary CTA button (table-based, email-safe). */
export function button(label, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="border-radius:999px;background:${ACCENT}">
    <a href="${href}" style="display:inline-block;padding:13px 26px;color:#ffffff;font-weight:bold;font-size:15px;text-decoration:none;border-radius:999px">${esc(label)}</a>
  </td></tr></table>`;
}

const CONFIRM_COPY = {
  fr: { h: 'Confirmez votre inscription', p: 'Merci de votre intérêt pour World Business Plus. Cliquez ci-dessous pour confirmer votre inscription et recevoir nos nouveautés produits et offres.', cta: 'Confirmer mon inscription', ignore: 'Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail.' },
  en: { h: 'Confirm your subscription', p: 'Thanks for your interest in World Business Plus. Click below to confirm your subscription and receive our new products and offers.', cta: 'Confirm subscription', ignore: 'If you didn’t request this, just ignore this email.' },
  ar: { h: 'أكد اشتراكك', p: 'شكراً لاهتمامك بـ World Business Plus. اضغط أدناه لتأكيد اشتراكك واستلام منتجاتنا وعروضنا الجديدة.', cta: 'تأكيد الاشتراك', ignore: 'إذا لم تطلب هذا، فتجاهل هذه الرسالة.' },
};

/** Double opt-in confirmation email (full HTML). */
export function confirmEmailHtml({ confirmUrl, lang = 'fr' }) {
  const c = CONFIRM_COPY[lang] || CONFIRM_COPY.fr;
  const body = `<h1 style="margin:0 0 10px;font-size:22px;color:${INK}">${c.h}</h1>
    <p style="margin:0 0 4px;color:${MUTED}">${c.p}</p>
    ${button(c.cta, confirmUrl)}
    <p style="margin:8px 0 0;font-size:12px;color:#9a9087">${c.ignore}</p>`;
  return wrapEmail({ title: c.h, preheader: c.p, bodyHtml: body, lang });
}

// ---- Campaign tracking helpers ----------------------------------------------
/** Rewrite every <a href="http..."> to go through the click tracker. */
export function rewriteLinksForTracking(html, sendId) {
  if (!sendId) return html;
  const base = `${siteUrl()}/api/email/click`;
  return String(html).replace(/href\s*=\s*"(https?:\/\/[^"]+)"/gi, (m, url) => {
    if (url.includes('/api/email/')) return m; // don't rewrite our own tracker/unsub
    return `href="${base}?s=${encodeURIComponent(sendId)}&u=${encodeURIComponent(url)}"`;
  });
}

/** 1x1 open-tracking pixel appended to the body. */
export function trackingPixel(sendId) {
  if (!sendId) return '';
  return `<img src="${siteUrl()}/api/email/open?s=${encodeURIComponent(sendId)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;opacity:0" />`;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}
