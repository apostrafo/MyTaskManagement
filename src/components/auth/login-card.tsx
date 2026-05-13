"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const getRedirectUrl = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (typeof window === "undefined") return siteUrl ?? "";
  if (siteUrl) return `${siteUrl}/auth/callback`;
  return `${window.location.origin}/auth/callback`;
};

export function LoginCard() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGoogleOAuth = async () => {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = getRedirectUrl();

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (signInError) {
      console.error(signInError);
      setError(signInError.message);
    } else {
      setError(null);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white/80 p-10 shadow-xl shadow-zinc-950/5 backdrop-blur-md">
      <div className="flex flex-col gap-3 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <ShieldCheck className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-semibold text-zinc-900">Priority Matrix Cloud</h1>
        <p className="text-sm text-zinc-500">
          Securely sign in with your Google Workspace account to access workspaces, projects, and team matrices.
        </p>
      </div>

      <button
        type="button"
        onClick={() => startTransition(handleGoogleOAuth)}
        disabled={isPending}
        className={cn(
          "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
          isPending && "opacity-80",
        )}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        {isPending ? "Connecting to Google..." : "Continue with Google"}
      </button>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <p className="mt-6 text-center text-xs text-zinc-400">
        By continuing you agree to our workspace usage policy and data residency terms.
      </p>
    </div>
  );
}

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.7-1.5 2.8-3.7 2.8-6.3 0-.8-.1-1.6-.3-2.3H12z"
    />
    <path fill="#34A853" d="M6.5 14.3 5.7 15.4l-2.4 1.8C5 20.9 8.3 23 12 23c2.5 0 4.7-.8 6.2-2.2l-3-2.3c-.8.5-1.8.9-3.2.9-2.5 0-4.6-1.7-5.4-4.1z" />
    <path fill="#4A90E2" d="M3.3 7.2C2.5 8.6 2 10.2 2 12s.5 3.4 1.3 4.8c0-.1 3.2-2.5 3.2-2.5-.2-.5-.3-1-.3-1.6s.1-1.1.3-1.6z" />
    <path
      fill="#FBBC05"
      d="M12 5.2c1.4 0 2.7.5 3.8 1.4l2.8-2.8C16.7 1.7 14.5.8 12 .8 8.3.8 5 2.9 3.3 6.2l3.5 2.7C7.4 6.9 9.5 5.2 12 5.2z"
    />
  </svg>
);
