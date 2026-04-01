import { PublicPortalView, PortalEntryScreen } from "@/components/app/portals/public-portal-view";

type ViewPageProps = {
  searchParams: Promise<{ portal_id?: string; code?: string }>;
};

export default async function ViewPage({ searchParams }: ViewPageProps) {
  const { portal_id, code } = await searchParams;

  if (!portal_id) {
    return <PortalEntryScreen preAuthCode={code} />;
  }

  return <PublicPortalView portalId={portal_id} preAuthCode={code} />;
}
