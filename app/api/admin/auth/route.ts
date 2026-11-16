import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/admin-auth";
import { verifyTOTP } from "@/lib/totp";

// Only POST is allowed - strictly verifies credentials, NEVER exposes secret or QR code
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password, mfaCode } = body;

    // 1. Verify Password
    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Access Denied: Incorrect password." }, { status: 401 });
    }

    // 2. Verify 6-digit Authenticator Code from Microsoft Authenticator
    if (!mfaCode) {
      return NextResponse.json({ error: "Access Denied: 6-digit Authenticator code is required." }, { status: 400 });
    }

    const isValidCode = verifyTOTP(mfaCode);
    if (!isValidCode) {
      return NextResponse.json(
        { error: "Access Denied: Invalid or expired 6-digit code. Check your phone." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, message: "Authorized" });
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
