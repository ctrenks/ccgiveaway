import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROLES } from "@/lib/constants";
import { SettingsForm } from "./SettingsForm";

export default async function AdminSettings() {
  const session = await auth();

  // Only admins can access settings
  if (!session?.user || session.user.role < ROLES.ADMIN) {
    redirect("/admin");
  }

  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <SettingsForm
          initialSettings={{
            discountType: settings?.discountType || "percentage",
            discountValue: settings?.discountValue ? Number(settings.discountValue) : 10,
            autoSyncEnabled: settings?.autoSyncEnabled ?? true,
            syncIntervalDays: settings?.syncIntervalDays || 3,
            giveawayCreditsPerDollar: settings?.giveawayCreditsPerDollar
              ? Number(settings.giveawayCreditsPerDollar)
              : 0.1,
            giveawayCreditsEnabled: settings?.giveawayCreditsEnabled ?? true,
          }}
        />
      </div>
    </div>
  );
}

