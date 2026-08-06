import { JoinFlow } from "@/components/admin/join-flow";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl text-porcelain">Platter</span>
          <h1 className="mt-3 font-display text-xl text-porcelain">Join the team</h1>
        </div>
        <JoinFlow token={token ?? null} />
      </div>
    </div>
  );
}
