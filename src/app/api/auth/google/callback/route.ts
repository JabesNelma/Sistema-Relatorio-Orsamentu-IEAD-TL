import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

/**
 * Google OAuth callback handler.
 * 
 * Exchanges the authorization code for tokens, verifies the user,
 * and creates a session if the email matches SUPER_ADMIN_EMAIL.
 */
export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      const loginUrl = new URL("/", requestUrl.origin);
      loginUrl.searchParams.set("error", errorDescription || error);
      return NextResponse.redirect(loginUrl);
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/?error=No authorization code received", requestUrl.origin)
      );
    }

    // Exchange code for session using PKCE flow
    const { data: { session }, error: exchangeError } = await supabaseServer.auth.exchangeCodeForSession(code);

    if (exchangeError || !session?.user) {
      console.error("Exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL("/?error=Authentication failed", requestUrl.origin)
      );
    }

    const user = session.user;
    const email = user.email;
    const name = user.user_metadata?.name || "Super Admin";

    if (!email) {
      return NextResponse.redirect(
        new URL("/?error=Email not found", requestUrl.origin)
      );
    }

    // Check if email matches the configured Super Admin email
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

    if (!superAdminEmail) {
      console.error("SUPER_ADMIN_EMAIL not configured");
      return NextResponse.redirect(
        new URL("/?error=Server configuration error", requestUrl.origin)
      );
    }

    if (email !== superAdminEmail) {
      return NextResponse.redirect(
        new URL(`/?error=Access denied. Only ${superAdminEmail} can login as Super Admin`, requestUrl.origin)
      );
    }

    // Find or create Super Admin profile
    let admin = await db.profile.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (!admin) {
      admin = await db.profile.create({
        data: {
          email: superAdminEmail,
          name: name,
          role: "SUPER_ADMIN",
          active: true,
        },
      });
    } else if (admin.email !== superAdminEmail) {
      admin = await db.profile.update({
        where: { id: admin.id },
        data: { email: superAdminEmail, name },
      });
    }

    if (!admin.active) {
      return NextResponse.redirect(
        new URL("/?error=Super Admin account is inactive", requestUrl.origin)
      );
    }

    // Create session
    await createSession(admin.id);

    // Redirect to dashboard
    return NextResponse.redirect(new URL("/?success=Login successful", requestUrl.origin));
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.redirect(
      new URL("/?error=Authentication error", new URL(req.url).origin)
    );
  }
}
