import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Gunakan login Google dari UI. Route ini hanya dipertahankan untuk kompatibilitas.",
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Login Google dipindahkan ke client-side Supabase OAuth flow.",
    },
    { status: 410 }
  );
}
