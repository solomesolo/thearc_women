import { NextResponse } from "next/server";

const CONTACT_EMAIL = "info@thearcwomen.com";

export type PrivacyRequestType = "access" | "deletion" | "correction" | "portability";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const requestType = body.requestType as PrivacyRequestType | undefined;
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const validTypes: PrivacyRequestType[] = ["access", "deletion", "correction", "portability"];
    const type = requestType && validTypes.includes(requestType) ? requestType : "access";

    // In production: enqueue email to CONTACT_EMAIL or CRM with email, type, message
    // For now we just validate and return success
    const payload = {
      email,
      requestType: type,
      message: message || undefined,
      receivedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Your request has been received. We will respond to the email address provided.",
      contactEmail: CONTACT_EMAIL,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
