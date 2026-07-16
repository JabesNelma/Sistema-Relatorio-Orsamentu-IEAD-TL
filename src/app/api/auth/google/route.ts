import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, errorResponse } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * Super Admin Google SSO login.
 * 
 * GET: Redirects to Google OAuth consent screen
 * POST: Handles direct token verification (alternative method)
 */

// GET: Initiate Google OAuth flow
export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirectTo = `${baseUrl}/api/auth/google/callback`;
    
    const { data, error } = await supabaseServer.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowser: true,
      },
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    // Redirect user to Google OAuth consent screen
    return NextResponse.redirect(data.url);
  } catch (err) {
    return errorResponse(err);
  }
}

// POST: Handle direct token verification (for testing/alternative flow)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { accessToken } = body;

    // If accessToken provided, verify it
    if (accessToken) {
      const { data: { user }, error } = await supabaseServer.auth.getUser(accessToken);
      
      if (error || !user) {
        return Response.json({ error: "Token tidak valid" }, { status: 401 });
      }

      return await handleGoogleUser(user);
    }

    // Otherwise, return info about OAuth flow
    return Response.json({ 
      message: "Gunakan GET untuk memulai OAuth flow",
      hint: "Atau kirim POST dengan { accessToken } untuk verifikasi langsung"
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * Handle Google user - check email and create session
 */
async function handleGoogleUser(googleUser: { email?: string; user_metadata?: { name?: string } }) {
  const email = googleUser.email;
  const name = googleUser.user_metadata?.name || "Super Admin";

  if (!email) {
    return Response.json({ error: "Email tidak ditemukan dari Google" }, { status: 400 });
  }

  // Check if email matches the configured Super Admin email
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  
  if (!superAdminEmail) {
    console.error("SUPER_ADMIN_EMAIL not configured in environment");
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }

  if (email !== superAdminEmail) {
    return Response.json({ 
      error: `Akses ditolak. Hanya akun ${superAdminEmail} yang dapat login sebagai Super Admin.` 
    }, { status: 403 });
  }

  // Find or create Super Admin profile
  let admin = await db.profile.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (!admin) {
    // Create Super Admin with the correct email
    admin = await db.profile.create({
      data: {
        email: superAdminEmail,
        name: name,
        role: "SUPER_ADMIN",
        active: true,
      },
    });
  } else if (admin.email !== superAdminEmail) {
    // Update email if different
    admin = await db.profile.update({
      where: { id: admin.id },
      data: { email: superAdminEmail, name },
    });
  }

  if (!admin.active) {
    return Response.json({ error: "Akun Super Admin tidak aktif" }, { status: 403 });
  }

  await createSession(admin.id);
  
  return Response.json({ 
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      regionId: admin.regionId,
      sukuId: admin.sukuId,
      regionName: null,
      sukuName: null,
    },
    message: "Login berhasil!"
  });
}

// Export handler for callback route
export { handleGoogleUser };
