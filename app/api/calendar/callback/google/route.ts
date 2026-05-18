import { type NextRequest, NextResponse } from "next/server";
import { decodeState, appBaseUrl } from "@/lib/calendar/oauthState";
import { getPrisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const base = appBaseUrl();
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${base}/settings?calendar_error=google_denied`);
  }

  const email = decodeState(state);
  if (!email) return NextResponse.redirect(`${base}/settings?calendar_error=invalid_state`);

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${base}/api/calendar/callback/google`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error_description ?? "token exchange failed");

    // Fetch primary calendar info
    const calRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList/primary", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const cal = calRes.ok ? await calRes.json() : {};

    const prisma = getPrisma();
    await prisma.connectedCalendar.upsert({
      where: { id: `google:${email}` },
      create: {
        id: `google:${email}`,
        userEmail: email,
        provider: "google",
        label: cal.summary ?? cal.id ?? "Google Calendar",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        calendarId: cal.id ?? "primary",
      },
      update: {
        label: cal.summary ?? cal.id ?? "Google Calendar",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        calendarId: cal.id ?? "primary",
      },
    });

    return NextResponse.redirect(`${base}/settings?calendar_connected=google`);
  } catch {
    return NextResponse.redirect(`${base}/settings?calendar_error=google_failed`);
  }
}
