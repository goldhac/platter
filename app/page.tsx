import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { resolveVenueFromHost } from "@/lib/venue/resolve";

export const dynamic = "force-dynamic";

// The platform apex serves the marketing site; a venue subdomain / custom domain
// serves that venue's menu at its root.
export default async function Home() {
  const host = (await headers()).get("host");
  if (await resolveVenueFromHost(host)) redirect("/menu");
  return <MarketingHome />;
}
