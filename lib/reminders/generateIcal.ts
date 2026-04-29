export interface IcalEvent {
  uid: string;
  summary: string;
  description: string;
  dtstart: Date;
  dtend: Date;
  url?: string;
}

function fmtDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function generateIcal(event: IcalEvent): string {
  const now = fmtDate(new Date());
  const start = fmtDate(event.dtstart);
  const end = fmtDate(event.dtend);
  const desc = event.description.replace(/\n/g, "\\n").replace(/,/g, "\\,");
  const summary = event.summary.replace(/,/g, "\\,");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Arc Woman//Health Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    event.url ? `URL:${event.url}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function googleCalendarUrl(event: IcalEvent): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.summary,
    details: event.description,
    dates: `${fmt(event.dtstart)}/${fmt(event.dtend)}`,
  });
  if (event.url) params.set("sprop", `website:${event.url}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
