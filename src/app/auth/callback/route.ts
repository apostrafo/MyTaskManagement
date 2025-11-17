import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const redirectToDashboard = (request: NextRequest) =>
  new URL(request.nextUrl.searchParams.get("redirectedFrom") ?? "/dashboard", request.url);

async function handleAuthCallback(request: NextRequest) {
  const supabase = createSupabaseServerClient();

  try {
    await supabase.auth.exchangeCodeForSession(request.url);
  } catch (error) {
    console.error("Failed to exchange auth code", error);
  }

  const nextPath = request.nextUrl.searchParams.get("next");
  const fallbackUrl = redirectToDashboard(request);
  const redirectUrl = nextPath ? new URL(nextPath, request.url) : fallbackUrl;
  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}

export async function POST(request: NextRequest) {
  return handleAuthCallback(request);
}
