"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/dashboard/actions";
import { Loader2, LogOut } from "lucide-react";

interface UserMenuProps {
  email?: string;
  name?: string | null;
}

export function UserMenu({ email, name }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/70 px-4 py-2 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
        {name?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "U"}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-zinc-900">{name ?? "Workspace user"}</span>
        <span className="text-xs text-zinc-500">{email}</span>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="ml-auto inline-flex items-center justify-center rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-indigo-200 hover:text-indigo-600"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      </button>
    </div>
  );
}
