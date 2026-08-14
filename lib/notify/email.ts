// Transactional email via Resend's HTTP API (no SDK dep — a single fetch keeps it lean).
// Server-only: RESEND_API_KEY + MAIL_FROM live in the server env (never the client bundle).
// Every send is best-effort — a mail failure must never break the action that triggered it.

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const BRAND_NAVY = "#1e2a3a";
const BRAND_ORANGE = "#f15a24";

export type EmailResult = { ok: true } | { ok: false; error: string };

type SendArgs = { to: string; subject: string; html: string; text: string };

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Platter <noreply@send.goldhac.com>";
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", to);
    return { ok: false, error: "email-not-configured" };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `resend ${res.status}: ${body.slice(0, 180)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "email-failed" };
  }
}

/** Minimal, email-client-safe shell (inline styles only; tables would be overkill here). */
function shell(inner: string): string {
  return `<div style="margin:0;padding:24px;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e8ec;">
    <div style="background:${BRAND_NAVY};padding:20px 28px;">
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">Platter</span>
    </div>
    <div style="padding:28px;color:${BRAND_NAVY};font-size:15px;line-height:1.55;">${inner}</div>
    <div style="padding:16px 28px;border-top:1px solid #eef0f2;color:#98a0ab;font-size:12px;">
      Sent by Platter — digital menus for restaurants.
    </div>
  </div>
</div>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND_ORANGE};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">${label}</a>`;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function sendInviteEmail(opts: {
  to: string;
  inviterName: string;
  venueName: string;
  role: string;
  joinUrl: string;
}): Promise<EmailResult> {
  const { to, inviterName, venueName, role, joinUrl } = opts;
  const subject = `You're invited to help manage ${venueName} on Platter`;
  const html = shell(
    `<p style="margin:0 0 14px;"><strong>${esc(inviterName)}</strong> invited you to join
     <strong>${esc(venueName)}</strong> on Platter as <strong>${esc(role)}</strong>.</p>
     <p style="margin:0 0 22px;color:#5a636e;">Platter is where the team keeps the menu up to date — prices,
     photos, sold-out toggles, all from your phone.</p>
     <p style="margin:0 0 22px;">${button(joinUrl, "Accept invitation")}</p>
     <p style="margin:0;color:#98a0ab;font-size:13px;">Or paste this link into your browser:<br>
     <a href="${joinUrl}" style="color:${BRAND_ORANGE};word-break:break-all;">${esc(joinUrl)}</a></p>`,
  );
  const text = `${inviterName} invited you to join ${venueName} on Platter as ${role}.\n\nAccept your invitation:\n${joinUrl}\n`;
  return sendEmail({ to, subject, html, text });
}
