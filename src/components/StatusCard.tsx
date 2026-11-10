import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export function StatusCard({
  tone,
  title,
  text,
  children,
}: {
  tone: "ok" | "warn" | "bad";
  title: string;
  text?: string;
  children?: React.ReactNode;
}) {
  const Icon = tone === "ok" ? CheckCircle2 : tone === "warn" ? AlertTriangle : XCircle;
  const color = tone === "ok" ? "text-lime" : tone === "warn" ? "text-amber-300" : "text-danger";
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-3xl border border-line bg-panel p-8 text-center">
      <Icon className={`mx-auto size-14 ${color}`} />
      <h1 className="mt-4 font-display text-4xl font-extrabold uppercase">{title}</h1>
      {text && <p className="mt-3 text-text/80">{text}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
