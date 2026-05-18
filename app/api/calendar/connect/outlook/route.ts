import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { encodeState, appBaseUrl } from "@/lib/calendar/oauthState";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Outlook Calendar not configured" }, { status: 503 });

  const redirectUri = `${appBaseUrl()}/api/calendar/callback/outlook`;
  const state = encodeState(session.user.email);

  const url = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email Calendars.ReadWrite offline_access");
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
