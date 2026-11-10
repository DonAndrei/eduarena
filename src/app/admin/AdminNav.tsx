import Link from "next/link";
import { Logo } from "@/components/Logo";
import { logout } from "./actions";

export function AdminNav({ active }: { active: "bookings" | "settings" }) {
  const cls = (a: boolean) => `rounded-lg px-3 py-2 ${a ? "bg-panel-2 text-text" : "text-muted hover:text-text"}`;
  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/admin"><Logo /></Link>
          <nav className="flex gap-1 text-sm font-semibold">
            <Link href="/admin" className={cls(active === "bookings")}>Rezervări</Link>
            <Link href="/admin/settings" className={cls(active === "settings")}>Setări</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/ro" target="_blank" className="hidden text-muted hover:text-text sm:block">Vezi site ↗</Link>
          <form action={logout}><button className="rounded-lg border border-line px-3 py-1.5 font-semibold">Ieșire</button></form>
        </div>
      </div>
    </header>
  );
}
