import { SettingsForm } from "@/components/admin/settings-form";
import { getRestaurantSettings } from "@/lib/queries/admin-settings";
import { getCurrentStaff } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const staff = await getCurrentStaff();
  const { restaurant, hours } = await getRestaurantSettings();

  if (!restaurant) {
    return (
      <div>
        <h1 className="font-display text-2xl text-porcelain">Settings</h1>
        <p className="mt-2 text-sm text-muted">No restaurant found.</p>
      </div>
    );
  }

  const isOwner = staff?.role === "owner";

  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">Settings</h1>
      {!isOwner && (
        <p className="mt-2 rounded-card border border-hairline/20 p-3 text-sm text-muted">
          Only the owner can change settings — you can view but not save.
        </p>
      )}
      <div className="mt-5">
        <SettingsForm restaurant={restaurant} hours={hours} />
      </div>
    </div>
  );
}
