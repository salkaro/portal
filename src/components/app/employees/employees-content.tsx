"use client";

import { useMemo, useState } from "react";
import { PlusIcon, TicketIcon, UsersRoundIcon } from "lucide-react";
import { NotAuthorised, NotAuthorisedNoOrganisation } from "@/components/ui/not-authorised";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PLANS, PLAN_LIMITS } from "@/constants/plans";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganisation } from "@/hooks/use-organisation";
import { useOrganisationInvites } from "@/hooks/use-organisation-invites";
import { useOrganisationMembers } from "@/hooks/use-organisation-members";
import { EmployeeTable } from "@/components/app/employees/employee-table";
import { AddMemberDialog } from "@/components/app/employees/dialogs/dialog-add-member";
import { ActiveInviteCodesDialog } from "@/components/app/employees/dialogs/dialog-active-invite-codes";

function isManageRole(role: string | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function EmployeesContent() {
  const { user } = useCurrentUser();
  const {
    organisation,
    loading: organisationLoading,
    error: organisationError,
  } = useOrganisation();
  const {
    members,
    loading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useOrganisationMembers(organisation?.id);
  const {
    invites,
    loading: invitesLoading,
    error: invitesError,
    refetch: refetchInvites,
  } = useOrganisationInvites(organisation?.id);

  const [showAddMember, setShowAddMember] = useState(false);
  const [showInviteCodes, setShowInviteCodes] = useState(false);

  const currentMembership = useMemo(
    () => members.find((member) => member.user_id === user?.id),
    [members, user?.id],
  );

  const canManageMembers = isManageRole(currentMembership?.role);
  const plan = organisation?.subscription ?? PLANS.FREE;
  const memberLimit = PLAN_LIMITS[plan].EMPLOYEES;
  const inviteLimit = PLAN_LIMITS[plan].INVITES;
  const hasLimit = Number.isFinite(memberLimit);
  const maxMemberCountHit = hasLimit && members.length >= memberLimit;
  const maxInviteCountHit = Number.isFinite(inviteLimit) && invites.length >= inviteLimit;

  async function handleMembersChanged() {
    await refetchMembers(true);
  }

  if (organisationLoading || membersLoading || invitesLoading) {
    return (
      <div className="space-y-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Separator />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (organisationError || membersError || invitesError) {
    return (
      <p className="py-6 text-sm text-destructive">
        {organisationError?.message ||
          membersError?.message ||
          invitesError?.message}
      </p>
    );
  }

  if (!organisation) {
    return <NotAuthorisedNoOrganisation />;
  }

  if (!canManageMembers) {
    return (
      <NotAuthorised
        icon={<UsersRoundIcon className="size-5" />}
        title="Admin access required"
        description="Only admins and owners can view and manage organisation members. Contact your organisation owner if you need access."
      />
    );
  }

  return (
    <section className="space-y-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInviteCodes(true)}
          disabled={!canManageMembers}
        >
          <TicketIcon />
          Active Invite Codes
        </Button>

        <Button
          size="sm"
          onClick={() => setShowAddMember(true)}
          disabled={!canManageMembers || maxMemberCountHit || maxInviteCountHit}
        >
          <PlusIcon />
          Add Member
        </Button>
      </div>

      <Separator />

      {maxMemberCountHit && canManageMembers && (
        <Alert>
          <AlertTitle>Employee limit reached</AlertTitle>
          <AlertDescription>
            You have reached the member limit for your current plan.
          </AlertDescription>
        </Alert>
      )}

      {maxInviteCountHit && canManageMembers && !maxMemberCountHit && (
        <Alert>
          <AlertTitle>Invite code limit reached</AlertTitle>
          <AlertDescription>
            You have {inviteLimit} active invite codes, which is the limit for your plan. Delete unused codes to create new ones.
          </AlertDescription>
        </Alert>
      )}

      <EmployeeTable
        members={members}
        memberLimit={memberLimit}
        currentUserId={user?.id ?? null}
        canManageMembers={canManageMembers}
        onChanged={handleMembersChanged}
      />

      <ActiveInviteCodesDialog
        open={showInviteCodes}
        organisationId={organisation.id}
        invites={invites}
        onClose={() => setShowInviteCodes(false)}
        onChanged={refetchInvites}
      />

      <AddMemberDialog
        open={showAddMember}
        organisationId={organisation.id}
        inviteLimit={inviteLimit}
        onClose={() => setShowAddMember(false)}
        onCreated={refetchInvites}
      />
    </section>
  );
}
