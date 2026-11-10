import "server-only";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

type AdminSession = { isAdmin?: boolean };

export async function getAdminSession() {
  return getIronSession<AdminSession>(await cookies(), {
    password: process.env.SESSION_SECRET!,
    cookieName: "eduarena_admin",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    },
  });
}

export async function isAdmin(): Promise<boolean> {
  return !!(await getAdminSession()).isAdmin;
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}
