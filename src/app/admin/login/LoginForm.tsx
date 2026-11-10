"use client";
import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Parolă</span>
        <input name="password" type="password" required autoFocus className="input" autoComplete="current-password" />
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-full bg-lime py-3 font-extrabold text-ink disabled:opacity-50">
        {pending ? "Se verifică…" : "Intră"}
      </button>
    </form>
  );
}
