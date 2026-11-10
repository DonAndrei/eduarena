import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/** Sends via Resend when configured; otherwise prints the email to the server log (dev). */
export async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!resend) {
    console.log(`\n=== EMAIL (dev, not sent) ===\nTo: ${to}\nSubject: ${subject}\n\n${text}\n=============================\n`);
    return;
  }
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "EduArena <onboarding@resend.dev>",
    to,
    subject,
    html,
    text,
  });
  if (error) console.error("Email send failed", error);
}
