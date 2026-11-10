import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminNav } from "../AdminNav";
import { SettingsForm } from "../AdminForms";

export default async function SettingsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const settings = await getSettings();
  return (
    <>
      <AdminNav active="settings" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-display text-4xl font-extrabold uppercase">Setări</h1>
        <div className="mt-6">
          <SettingsForm settings={settings} />
        </div>
      </div>
    </>
  );
}
