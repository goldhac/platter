import { ModifierForm } from "@/components/admin/modifier-form";

export const dynamic = "force-dynamic";

export default function NewModifierPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">New add-on group</h1>
      <div className="mt-5">
        <ModifierForm />
      </div>
    </div>
  );
}
