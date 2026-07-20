import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

/**
 * OAuth callback route for Google sign-in.
 */
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?error=No authorization code received", requestUrl.origin)
    );
  }

  const { data, error: exchangeError } = await supabaseServer.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.session?.user) {
    return NextResponse.redirect(
      new URL("/?error=Authentication failed", requestUrl.origin)
    );
  }

  const user = data.session.user;
  const email = user.email;
  const name = user.user_metadata?.name || "Super Admin";
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

  if (!email || !superAdminEmail || email !== superAdminEmail) {
    return NextResponse.redirect(
      new URL("/?error=Access denied", requestUrl.origin)
    );
  }

  let admin = await db.profile.findFirst({ where: { role: "SUPER_ADMIN" } });

  if (!admin) {
    admin = await db.profile.create({
      data: {
        email: superAdminEmail,
        name,
        role: "SUPER_ADMIN",
        active: true,
      },
    });
  }

  await createSession(admin.id);
  return NextResponse.redirect(new URL("/?success=Login successful", requestUrl.origin));
}