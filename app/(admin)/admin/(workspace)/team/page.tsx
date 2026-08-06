import { redirect } from "next/navigation";
import { TeamManager } from "@/components/admin/team-manager";
import { getTeam } from "@/lib/queries/admin-team";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const data = await getTeam();
  if (!data) redirect("/admin/login");

  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">Team</h1>
      <p className="mt-1 text-sm text-muted">Invite staff and managers to help run your menu.</p>
      <div className="mt-5">
        <TeamManager data={data} />
      </div>
    </div>
  );
}
