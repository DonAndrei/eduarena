import "server-only";
import { formatDateLong, formatDuration, formatPrice, formatTime, priceFor } from "./format";

type B = { name: string; startAt: Date; endAt: Date; phone: string; email: string; note?: string | null };

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

function summary(b: B, locale: string, pricePerHour: number) {
  const minutes = (b.endAt.getTime() - b.startAt.getTime()) / 60000;
  const date = formatDateLong(b.startAt, locale);
  const time = `${formatTime(b.startAt, locale)} – ${formatTime(b.endAt, locale)}`;
  const dur = formatDuration(minutes, locale);
  const price = formatPrice(priceFor(minutes, pricePerHour));
  return { date, time, dur, price };
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#0b0f0c;font-family:Arial,sans-serif;color:#e8efe9">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
<div style="font-weight:800;font-size:22px;letter-spacing:.5px;color:#c6f432">EDUARENA</div>
<h1 style="font-size:22px;margin:24px 0 12px">${title}</h1>${body}
</div></body></html>`;
}

const btn = (href: string, label: string) =>
  `<p style="margin:28px 0"><a href="${href}" style="background:#c6f432;color:#0b0f0c;padding:14px 22px;border-radius:10px;font-weight:700;text-decoration:none;display:inline-block">${label}</a></p>`;

const box = (rows: [string, string][]) =>
  `<table style="width:100%;border-collapse:collapse;background:#141a16;border-radius:12px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 14px;color:#8fa093">${k}</td><td style="padding:10px 14px;font-weight:700;text-align:right">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;

const T = {
  ro: {
    confirmSubject: "Confirmă rezervarea ta la EduArena",
    confirmTitle: (n: string) => `Salut, ${n}!`,
    confirmIntro: (min: number) =>
      `Mai ai un singur pas: confirmă rezervarea apăsând butonul de mai jos. Ținem terenul pentru tine ${min} de minute.`,
    confirmBtn: "Confirmă rezervarea",
    confirmedSubject: "Rezervare confirmată – EduArena",
    confirmedTitle: "Rezervarea ta este confirmată ✅",
    confirmedIntro: "Te așteptăm pe teren! Plata se face la locație.",
    cancelText: "Nu mai poți veni? Anulează rezervarea:",
    cancelBtn: "Anulează rezervarea",
    date: "Data",
    time: "Ora",
    duration: "Durata",
    price: "Preț estimat",
    ignore: "Dacă nu ai făcut tu această rezervare, ignoră acest email.",
  },
  en: {
    confirmSubject: "Confirm your EduArena booking",
    confirmTitle: (n: string) => `Hi ${n}!`,
    confirmIntro: (min: number) =>
      `One last step: confirm your booking with the button below. We hold the pitch for you for ${min} minutes.`,
    confirmBtn: "Confirm booking",
    confirmedSubject: "Booking confirmed – EduArena",
    confirmedTitle: "Your booking is confirmed ✅",
    confirmedIntro: "See you on the pitch! Payment is made on site.",
    cancelText: "Can't make it? Cancel your booking:",
    cancelBtn: "Cancel booking",
    date: "Date",
    time: "Time",
    duration: "Duration",
    price: "Estimated price",
    ignore: "If you didn't make this booking, just ignore this email.",
  },
};

const t = (locale: string) => (locale === "en" ? T.en : T.ro);

export function confirmEmail(b: B, locale: string, token: string, pricePerHour: number, holdMinutes: number) {
  const s = summary(b, locale, pricePerHour);
  const tr = t(locale);
  const url = `${appUrl()}/${locale}/book/confirm?token=${token}`;
  const rows: [string, string][] = [
    [tr.date, s.date],
    [tr.time, s.time],
    [tr.duration, s.dur],
    [tr.price, s.price],
  ];
  return {
    subject: tr.confirmSubject,
    html: layout(
      tr.confirmTitle(esc(b.name)),
      `<p>${tr.confirmIntro(holdMinutes)}</p>${box(rows)}${btn(url, tr.confirmBtn)}<p style="color:#8fa093;font-size:13px">${tr.ignore}</p>`,
    ),
    text: `${tr.confirmTitle(b.name)}\n${tr.confirmIntro(holdMinutes)}\n\n${rows.map((r) => r.join(": ")).join("\n")}\n\n${tr.confirmBtn}: ${url}\n\n${tr.ignore}`,
  };
}

export function confirmedEmail(b: B, locale: string, cancelToken: string, pricePerHour: number) {
  const s = summary(b, locale, pricePerHour);
  const tr = t(locale);
  const url = `${appUrl()}/${locale}/book/cancel?token=${cancelToken}`;
  const rows: [string, string][] = [
    [tr.date, s.date],
    [tr.time, s.time],
    [tr.duration, s.dur],
    [tr.price, s.price],
  ];
  return {
    subject: tr.confirmedSubject,
    html: layout(
      tr.confirmedTitle,
      `<p>${tr.confirmedIntro}</p>${box(rows)}<p style="margin-top:28px;color:#8fa093">${tr.cancelText}</p>${btn(url, tr.cancelBtn)}`,
    ),
    text: `${tr.confirmedTitle}\n${tr.confirmedIntro}\n\n${rows.map((r) => r.join(": ")).join("\n")}\n\n${tr.cancelText} ${url}`,
  };
}

/** Owner notifications are always in Romanian. */
export function ownerEmail(kind: "new" | "cancelled", b: B, pricePerHour: number) {
  const s = summary(b, "ro", pricePerHour);
  const title = kind === "new" ? "Rezervare nouă confirmată" : "Rezervare anulată de client";
  const rows: [string, string][] = [
    ["Nume", b.name],
    ["Telefon", b.phone],
    ["Email", b.email],
    ["Data", s.date],
    ["Ora", s.time],
    ["Durata", s.dur],
    ["Preț", s.price],
  ];
  if (b.note) rows.push(["Mesaj", b.note]);
  return {
    subject: `${title}: ${s.date}, ${s.time}`,
    html: layout(title, `${box(rows)}${btn(`${appUrl()}/admin`, "Deschide panoul admin")}`),
    text: `${title}\n\n${rows.map((r) => r.join(": ")).join("\n")}`,
  };
}
