import { getCurrentUser, errorResponse } from "@/lib/auth";

/** Return the current authenticated user (or null). */
export async function GET() {
  try {
    const user = await getCurrentUser();
    return Response.json({ user });
  } catch (err) {
    return errorResponse(err);
  }
}
