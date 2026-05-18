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
    return NextResponse.redirect(`${base}/settings?calendar_error=outlook_denied`);
  }

  const email = decodeState(state);
  if (!email) return NextResponse.redirect(`${base}/settings?calendar_error=invalid_state`);

  const clientId = process.env.MICROSOFT_CLIENT_ID!;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
  const redirectUri = `${base}/api/calendar/callback/outlook`;

  try {
    const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error_description ?? "token exchange failed");

    // Fetch default calendar info
    const calRes = await fetch("https://graph.microsoft.com/v1.0/me/calendar", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const cal = calRes.ok ? await calRes.json() : {};

    const prisma = getPrisma();
    await prisma.connectedCalendar.upsert({
      where: { id: `outlook:${email}` },
      create: {
        id: `outlook:${email}`,
        userEmail: email,
        provider: "outlook",
        label: cal.name ?? "Outlook Calendar",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        calendarId: cal.id ?? null,
      },
      update: {
        label: cal.name ?? "Outlook Calendar",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        calendarId: cal.id ?? null,
      },
    });

    return NextResponse.redirect(`${base}/settings?calendar_connected=outlook`);
  } catch {
    return NextResponse.redirect(`${base}/settings?calendar_error=outlook_failed`);
  }
}
