import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="turf grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-panel p-8">
        <Logo />
        <h1 className="mt-6 font-display text-3xl font-extrabold uppercase">Panou administrare</h1>
        <LoginForm />
      </div>
    </div>
  );
}
