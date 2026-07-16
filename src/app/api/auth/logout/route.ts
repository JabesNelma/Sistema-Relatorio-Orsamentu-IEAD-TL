import { destroySession, errorResponse } from "@/lib/auth";

/** Logout: destroy the current session. */
export async function POST() {
  try {
    await destroySession();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
