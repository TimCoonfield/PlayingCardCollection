"use client";

import { useActionState } from "react";
import { login } from "./actions";

interface LoginState {
  error?: string;
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="flex flex-col gap-4 w-full max-w-xs">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-felt-sub">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          required
          className="rounded-md border border-felt-line bg-felt-surface px-3 py-2 text-felt-ink outline-none focus:border-brass"
        />
      </div>
      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brass px-3 py-2 text-sm font-semibold text-felt-bg hover:bg-brass-deep disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
