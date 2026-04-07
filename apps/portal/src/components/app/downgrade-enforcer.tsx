"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangleIcon, CreditCardIcon, LogOutIcon, ShieldAlertIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@salkaro/ui";
import { Badge } from "@salkaro/ui";
import { Spinner } from "@salkaro/ui";
import { useOrganisation } from "@/hooks/use-organisation";
import { usePortals } from "@/hooks/use-portals";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PLAN_LIMITS } from "@/constants/plans";
import { SETTINGS_ROUTES } from "@/constants/routes";
import { deletePortal, getPortals } from "@/services/supabase/portals";
import {
  getOrganisationMembers,
  removeOrganisationMember,
  type OrganisationMember,
} from "@/services/supabase/employees";
import { handleSignOut } from "@/lib/sign-out";
import type { Portal } from "@/types/portal";
import type { PlanTier } from "@/lib/plans";

// ── helpers ────────────────────────────────────────────────────────────────

function getLimits(plan: PlanTier) {
  return PLAN_LIMITS[plan];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── sub-components ─────────────────────────────────────────────────────────

function PortalRow({
  portal,
  organisationId,
  onDeleted,
}: {
  portal: Portal;
  organisationId: string;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deletePortal({ organisationId, portalId: portal.id });
    if (result.error) {
      toast.error(result.error.message);
      setDeleting(false);
      return;
    }
    toast.success(`"${portal.name}" deleted.`);
    onDeleted();
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{portal.name}</p>
        <p className="text-xs text-muted-foreground">
          Created {formatDate(portal.created_at)}
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        disabled={deleting}
        onClick={() => void handleDelete()}
        className="shrink-0"
      >
        {deleting ? <Spinner className="size-3.5" /> : <Trash2Icon className="size-3.5" />}
        Delete
      </Button>
    </div>
  );
}

function MemberRow({
  member,
  organisationId,
  onRemoved,
}: {
  member: OrganisationMember;
  organisationId: string;
  onRemoved: () => void;
}) {
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    const result = await removeOrganisationMember({
      organisationId,
      userId: member.user_id,
    });
    if (result.error) {
      toast.error(result.error.message);
      setRemoving(false);
      return;
    }
    toast.success("Member removed.");
    onRemoved();
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {member.full_name || member.email || "Member"}
        </p>
        <p className="text-xs text-muted-foreground">
          {member.email ?? ""} · <span className="capitalize">{member.role}</span>
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        disabled={removing}
        onClick={() => void handleRemove()}
        className="shrink-0"
      >
        {removing ? <Spinner className="size-3.5" /> : <Trash2Icon className="size-3.5" />}
        Remove
      </Button>
    </div>
  );
}

// ── read-only overlay for non-admin members ────────────────────────────────

function MemberOverLimit({ planLabel }: { planLabel: string }) {
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    await handleSignOut();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlertIcon className="size-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold text-foreground">
              Organisation over plan limits
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-65">
              This organisation has exceeded its <span className="font-medium">{planLabel}</span> plan
              limits. An admin or owner needs to remove excess members or portals before you can
              continue.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={signingOut}
            onClick={() => void onSignOut()}
          >
            {signingOut ? <Spinner className="size-3.5" /> : <LogOutIcon className="size-3.5" />}
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function DowngradeEnforcer() {
  const { organisation, loading: orgLoading } = useOrganisation();
  const { user, loading: userLoading } = useCurrentUser();
  const { portals: seedPortals, loading: portalsLoading } = usePortals();

  const [portals, setPortals] = useState<Portal[]>([]);
  const [members, setMembers] = useState<OrganisationMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // Sync seed portals into local state once loaded
  useEffect(() => {
    if (!portalsLoading) {
      setPortals(seedPortals);
    }
  }, [portalsLoading, seedPortals]);

  const fetchPortals = useCallback(async () => {
    if (!organisation?.id) return;
    const result = await getPortals(organisation.id);
    if (!result.error) setPortals(result.data);
  }, [organisation?.id]);

  const fetchMembers = useCallback(async (showLoading = false) => {
    if (!organisation?.id) return;
    if (showLoading) setMembersLoading(true);
    const result = await getOrganisationMembers(organisation.id);
    setMembers(result.data);
    setMembersLoading(false);
  }, [organisation?.id]);

  useEffect(() => {
    if (!orgLoading && organisation?.id) {
      void fetchMembers(true);
    }
  }, [orgLoading, organisation?.id, fetchMembers]);

  const pathname = usePathname();

  // Wait until everything is loaded
  if (orgLoading || portalsLoading || membersLoading || userLoading || !organisation) return null;

  // Allow billing page so admins/owners can upgrade
  if (pathname === SETTINGS_ROUTES.BILLING) return null;

  const plan = organisation.subscription as PlanTier;
  const limits = getLimits(plan);

  const portalLimit = limits.PORTALS;
  const memberLimit = limits.EMPLOYEES;

  const portalsOver = Number.isFinite(portalLimit) && portals.length > portalLimit
    ? portals.length - portalLimit
    : 0;

  // Members: owner counts toward the limit but cannot be removed.
  // Total member count is compared against the plan limit.
  // Removable candidates are non-owners, excluding the current user.
  const removableMembers = members.filter((m) => m.role !== "owner" && m.user_id !== user?.id);
  const membersOver = Number.isFinite(memberLimit) && members.length > memberLimit
    ? members.length - memberLimit
    : 0;

  // No violations — render nothing
  if (portalsOver === 0 && membersOver === 0) return null;

  const currentMember = members.find((m) => m.user_id === user?.id);
  const currentRole = currentMember?.role ?? "member";
  const canManage = currentRole === "owner" || currentRole === "admin";
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  // Non-admins/owners see a simple informational overlay
  if (!canManage) {
    return <MemberOverLimit planLabel={planLabel} />;
  }

  // Portals to display: most recently created first
  const sortedPortals = [...portals].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Members to display: removable candidates, most recently joined first
  const sortedMembers = [...removableMembers].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <AlertTriangleIcon className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Account over plan limits
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your <span className="font-medium">{planLabel}</span> plan allows{" "}
              {Number.isFinite(portalLimit) ? portalLimit : "unlimited"} portal
              {portalLimit !== 1 ? "s" : ""} and{" "}
              {Number.isFinite(memberLimit) ? memberLimit : "unlimited"} member
              {memberLimit !== 1 ? "s" : ""}. Remove the items below or upgrade your plan to continue.
            </p>
          </div>
          <a href={SETTINGS_ROUTES.BILLING} className="shrink-0 ml-auto">
            <Button variant="outline" size="sm">
              <CreditCardIcon className="size-3.5" />
              Upgrade
            </Button>
          </a>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-6">
          {/* Portals section */}
          {portalsOver > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-foreground">Portals</p>
                <Badge variant="destructive" className="text-[0.625rem]">
                  {portals.length} / {portalLimit} — delete {portalsOver} more
                </Badge>
              </div>
              <div className="space-y-2">
                {sortedPortals.map((portal) => (
                  <PortalRow
                    key={portal.id}
                    portal={portal}
                    organisationId={organisation.id}
                    onDeleted={() => void fetchPortals()}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Members section */}
          {membersOver > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-foreground">Members</p>
                <Badge variant="destructive" className="text-[0.625rem]">
                  {members.length} / {memberLimit} — remove {membersOver} more
                </Badge>
              </div>
              <div className="space-y-2">
                {sortedMembers.map((member) => (
                  <MemberRow
                    key={member.user_id}
                    member={member}
                    organisationId={organisation.id}
                    onRemoved={() => void fetchMembers(false)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
