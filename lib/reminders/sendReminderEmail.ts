export interface ReminderEmailPayload {
  to: string;
  checkName: string;
  remindAt: Date;
  appUrl?: string;
}

export async function sendReminderEmail(payload: ReminderEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "reminders@thearc.com";
  if (!apiKey) {
    console.warn("[sendReminderEmail] RESEND_API_KEY not set — skipping email");
    return;
  }

  const dateStr = payload.remindAt.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0c0c0c">
      <p style="font-size:18px;font-weight:600;margin-bottom:8px">Health check reminder</p>
      <p style="margin-top:0">You asked us to remind you about:</p>
      <p style="font-size:16px;font-weight:600;background:#f5f5f3;padding:12px 16px;border-radius:8px">
        ${payload.checkName}
      </p>
      <p>Scheduled for <strong>${dateStr}</strong>.</p>
      ${payload.appUrl ? `<p><a href="${payload.appUrl}" style="color:#0c0c0c;font-weight:600">Open The Arc Woman →</a></p>` : ""}
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0"/>
      <p style="font-size:12px;color:#888">The Arc Woman · Women's health personalisation platform</p>
    </div>
  `.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: `Reminder: ${payload.checkName}`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}
