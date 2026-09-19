import { JoinFlow } from "@/components/admin/join-flow";

export const dynamic = "force-dynamic";

const OCTAGON = "polygon(29% 0,71% 0,100% 29%,100% 71%,71% 100%,29% 100%,0 71%,0 29%)";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span
            className="mx-auto grid h-[52px] w-[52px] place-items-center bg-accent font-display text-2xl text-on-accent"
            style={{ clipPath: OCTAGON }}
            aria-hidden
          >
            P
          </span>
          <h1 className="mt-5 font-display text-[28px] leading-none tracking-[-0.02em] text-text">Join the team</h1>
        </div>
        <JoinFlow token={token ?? null} />
      </div>
    </div>
  );
}
