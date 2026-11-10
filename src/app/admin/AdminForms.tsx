"use client";
import { useActionState, useEffect, useRef } from "react";
import { adminAddBooking, adminBlock, saveSettings, type ActionState } from "./actions";
import type { VenueSettings } from "@/lib/settings";

const times = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
const durations = [60, 90, 120, 150, 180, 210, 240];

function TimeSelect({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <select name={name} defaultValue={defaultValue} className="input">
      {times.map((t) => <option key={t}>{t}</option>)}
    </select>
  );
}

function Msg({ state }: { state: ActionState }) {
  if (!state) return null;
  return state.error ? <p className="text-sm text-danger">{state.error}</p> : <p className="text-sm text-lime">{state.ok}</p>;
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <h3 className="font-display text-xl font-extrabold uppercase">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function useResetOnOk(state: ActionState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return ref;
}

export function AddBookingForm({ date }: { date: string }) {
  const [state, action, pending] = useActionState(adminAddBooking, undefined);
  const ref = useResetOnOk(state);
  return (
    <Card title="Rezervare telefonică" subtitle="Adaugă direct o rezervare primită la telefon (confirmată automat).">
      <form ref={ref} action={action} className="space-y-3 text-sm">
        <input type="date" name="date" defaultValue={date} key={date} required className="input" />
        <div className="grid grid-cols-2 gap-2">
          <TimeSelect name="from" defaultValue="18:00" />
          <select name="duration" defaultValue="60" className="input">
            {durations.map((d) => <option key={d} value={d}>{d / 60} h</option>)}
          </select>
        </div>
        <input name="name" placeholder="Nume" required className="input" />
        <input name="phone" placeholder="Telefon" type="tel" className="input" />
        <input name="note" placeholder="Notă (opțional)" className="input" />
        <Msg state={state} />
        <button disabled={pending} className="w-full rounded-full bg-lime py-2.5 font-extrabold text-ink disabled:opacity-50">Adaugă</button>
      </form>
    </Card>
  );
}

export function BlockForm({ date }: { date: string }) {
  const [state, action, pending] = useActionState(adminBlock, undefined);
  const ref = useResetOnOk(state);
  return (
    <Card title="Blochează interval" subtitle="Mentenanță, turnee, evenimente private — clienții nu pot rezerva.">
      <form ref={ref} action={action} className="space-y-3 text-sm">
        <input type="date" name="date" defaultValue={date} key={date} required className="input" />
        <div className="grid grid-cols-2 gap-2">
          <TimeSelect name="from" defaultValue="09:00" />
          <TimeSelect name="to" defaultValue="12:00" />
        </div>
        <input name="reason" placeholder="Motiv (opțional)" className="input" />
        <Msg state={state} />
        <button disabled={pending} className="w-full rounded-full border border-line py-2.5 font-bold disabled:opacity-50">Blochează</button>
      </form>
    </Card>
  );
}

const DAYS: [string, string][] = [["1", "Luni"], ["2", "Marți"], ["3", "Miercuri"], ["4", "Joi"], ["5", "Vineri"], ["6", "Sâmbătă"], ["0", "Duminică"]];

export function SettingsForm({ settings }: { settings: VenueSettings }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  const num = (name: keyof VenueSettings, label: string, hint: string) => (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input type="number" name={name} defaultValue={settings[name] as number} className="input" />
      <span className="mt-1 block text-xs text-muted">{hint}</span>
    </label>
  );
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-2">
      <Card title="Program">
        <div className="space-y-2">
          {DAYS.map(([d, label]) => {
            const h = settings.hours[d];
            return (
              <div key={d} className="grid grid-cols-[90px_1fr_1fr_auto] items-center gap-2 text-sm">
                <span className="font-semibold">{label}</span>
                <TimeSelect name={`open_${d}`} defaultValue={h?.open ?? "09:00"} />
                <TimeSelect name={`close_${d}`} defaultValue={h?.close ?? "23:00"} />
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  <input type="checkbox" name={`closed_${d}`} defaultChecked={!h} className="accent-lime" /> Închis
                </label>
              </div>
            );
          })}
          <p className="pt-2 text-xs text-muted">Ora de închidere 00:00 = la miezul nopții.</p>
        </div>
      </Card>
      <Card title="Reguli rezervare">
        <div className="grid gap-4 sm:grid-cols-2">
          {num("pricePerHour", "Preț / oră (lei)", "Afișat clienților, plata la teren.")}
          {num("maxDurationMinutes", "Durată maximă (minute)", "Ex: 180 = 3 ore.")}
          {num("maxAdvanceDays", "Rezervare cu max. X zile înainte", "Câte zile în viitor se văd.")}
          {num("pendingHoldMinutes", "Timp confirmare email (minute)", "După, rezervarea neconfirmată expiră.")}
          {num("maxActivePerPerson", "Rezervări active / persoană", "Anti-abuz: după email sau telefon.")}
        </div>
      </Card>
      <div className="flex items-center gap-4 lg:col-span-2">
        <button disabled={pending} className="rounded-full bg-lime px-8 py-3 font-extrabold text-ink disabled:opacity-50">Salvează</button>
        <Msg state={state} />
      </div>
    </form>
  );
}
