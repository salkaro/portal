"use client";

import Link from "next/link";
import {
  ActivityIcon,
  GlobeIcon,
  RefreshCcwIcon,
  ShieldIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SalkaroTable,
  type SalkaroColumn,
} from "@/components/ui/salkaro-table";
import { ActivitySkeleton } from "@/components/app/activity/activity-skeleton";
import { useCallback, useEffect, useState } from "react";
import { PLANS, PRO_PLAN_LIMITS } from "@/constants/plans";
import { SETTINGS_ROUTES } from "@/constants/routes";
import { useActivityEvents } from "@/hooks/use-activity-events";
import { useRefreshCooldown } from "@/hooks/use-refresh-cooldown";
import { useOrganisation } from "@/hooks/use-organisation";
import {
  readSessionCache,
  writeSessionCache,
} from "@/lib/session-storage-cache";
import { ServiceError } from "@/services/service-error";
import { getPortals } from "@/services/supabase/portals";
import type { PortalEvent } from "@/app/api/activity/route";
import type { Portal } from "@/types/portal";
import { formatDateTime } from "@/utils/format-dates";

function formatEventType(eventType: string): string {
  const [domain, action] = eventType.split(".");

  if (!action) {
    return eventType.replace(/[_-]/g, " ");
  }

  return `${domain} ${action}`.replace(/[_-]/g, " ");
}

function eventSummary(event: PortalEvent): string {
  const portalName =
    typeof event.metadata?.portalName === "string"
      ? event.metadata.portalName
      : null;

  if (event.event_type === "portal.created")
    return `${portalName ?? "Portal"} was created`;
  if (event.event_type === "portal.deleted")
    return `${portalName ?? "Portal"} was deleted`;
  if (event.event_type === "portal.status_changed") {
    const status =
      typeof event.metadata?.status === "string" ? event.metadata.status : null;
    return `${portalName ?? "Portal"} status changed${status ? ` to ${status}` : ""}`;
  }
  if (event.event_type === "portal.updated")
    return `${portalName ?? "Portal"} was updated`;
  if (event.event_type === "portal.access_updated")
    return "Portal access settings were changed";
  if (event.event_type === "portal.fields_updated")
    return "Portal displayed fields were changed";
  if (event.event_type === "portal.sections_updated")
    return "Portal visible sections were changed";
  if (event.event_type === "portal.otp_requested")
    return "A client requested a one-time passcode";
  if (event.event_type === "portal.pdf_exported")
    return "A client exported the portal as PDF";
  if (event.event_type === "portal.code_verified")
    return "A client unlocked a portal using code";
  if (event.event_type === "portal.otp_verified")
    return "A client unlocked a portal via email OTP";
  if (event.event_type === "organisation.member.role_changed")
    return "A team member role was updated";
  if (event.event_type === "organisation.member.removed")
    return "A team member was removed";
  if (event.event_type === "organisation.member.approved")
    return "A team member access was approved";
  if (event.event_type === "organisation.invite.created")
    return "An invite link was created";
  if (event.event_type === "organisation.invite.deleted")
    return "An invite link was deleted";

  return formatEventType(event.event_type);
}

function actorDisplay(event: PortalEvent): string {
  if (event.actor_label) return event.actor_label;
  if (event.actor_type === "external") return "External visitor";
  return "Team member";
}

function actorTypeBadge(type: PortalEvent["actor_type"]) {
  if (type === "external") {
    return (
      <Badge
        variant="outline"
        className="border-blue-500/30 bg-blue-500/10 text-blue-700"
      >
        <GlobeIcon className="size-3" />
        External
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
    >
      <ShieldIcon className="size-3" />
      Internal
    </Badge>
  );
}

export function ActivityContent() {
  const { organisation } = useOrganisation();
  const { events, loading, error, refetch } = useActivityEvents();
  const { refresh, refreshing, disabled: refreshDisabled } = useRefreshCooldown(useCallback(async (silent: boolean) => { await refetch(silent) }, [refetch]));
  const [portalNamesById, setPortalNamesById] = useState<
    Record<string, string>
  >({});

  const organisationId = organisation?.id ?? null;
  const isFreePlan = organisation?.subscription === PLANS.FREE;
  const eventLimit = PRO_PLAN_LIMITS.ACTIVITY_EVENTS;

  useEffect(() => {
    if (!organisationId) {
      setPortalNamesById((current) =>
        Object.keys(current).length === 0 ? current : {},
      );
      return;
    }

    const cacheKey = `cache:portals:${organisationId}`;
    const idsToResolve = Array.from(
      new Set(
        events
          .map((event) => event.portal_id)
          .filter((portalId): portalId is string => !!portalId),
      ),
    ).filter((portalId) => !portalNamesById[portalId]);

    if (idsToResolve.length === 0) {
      return;
    }

    const cachedPortals = readSessionCache<Portal[]>(cacheKey) ?? [];
    const cachedNameMap = new Map(
      cachedPortals.map((portal) => [portal.id, portal.name]),
    );

    const resolvedFromCache: Record<string, string> = {};
    for (const portalId of idsToResolve) {
      const cachedName = cachedNameMap.get(portalId);
      if (cachedName) {
        resolvedFromCache[portalId] = cachedName;
      }
    }

    if (Object.keys(resolvedFromCache).length > 0) {
      setPortalNamesById((current) => ({ ...current, ...resolvedFromCache }));
    }

    const unresolvedIds = idsToResolve.filter(
      (portalId) => !resolvedFromCache[portalId],
    );
    if (unresolvedIds.length === 0) {
      return;
    }

    let cancelled = false;

    const resolveFromDatabase = async () => {
      const result = await getPortals(organisationId);
      if (cancelled || result.error) return;

      writeSessionCache(cacheKey, result.data);

      const databaseNameMap = new Map(
        result.data.map((portal) => [portal.id, portal.name]),
      );
      const resolvedFromDatabase: Record<string, string> = {};

      for (const portalId of unresolvedIds) {
        const portalName = databaseNameMap.get(portalId);
        if (portalName) {
          resolvedFromDatabase[portalId] = portalName;
        }
      }

      if (Object.keys(resolvedFromDatabase).length > 0) {
        setPortalNamesById((current) => ({
          ...current,
          ...resolvedFromDatabase,
        }));
      }
    };

    void resolveFromDatabase();

    return () => {
      cancelled = true;
    };
  }, [events, organisationId, portalNamesById]);

  const columns: SalkaroColumn<PortalEvent>[] = [
    {
      key: "event",
      label: "Event",
      render: (event) => (
        <span className="font-medium">{eventSummary(event)}</span>
      ),
      searchValue: (event) => `${eventSummary(event)} ${event.event_type}`,
    },
    {
      key: "actor",
      label: "Actor",
      render: (event) => (
        <div className="flex items-center gap-2">
          {actorTypeBadge(event.actor_type)}
          <span className="text-xs text-muted-foreground">
            {actorDisplay(event)}
          </span>
        </div>
      ),
      searchValue: (event) => `${actorDisplay(event)} ${event.actor_type}`,
    },
    {
      key: "portal",
      label: "Portal",
      render: (event) => {
        const portalNameFromMetadata =
          typeof event.metadata?.portalName === "string"
            ? event.metadata.portalName
            : null;
        const portalNameFromLookup = event.portal_id
          ? (portalNamesById[event.portal_id] ?? null)
          : null;
        const portalName = portalNameFromMetadata ?? portalNameFromLookup;

        if (portalName) {
          return portalName;
        }

        if (!event.portal_id) {
          return <span className="text-muted-foreground">N/A</span>;
        }

        return <span className="text-muted-foreground">Unknown portal</span>;
      },
      searchValue: (event) => {
        const portalNameFromMetadata =
          typeof event.metadata?.portalName === "string"
            ? event.metadata.portalName
            : null;
        const portalNameFromLookup = event.portal_id
          ? (portalNamesById[event.portal_id] ?? null)
          : null;
        const portalName = portalNameFromMetadata ?? portalNameFromLookup;

        return portalName ?? "";
      },
    },
    {
      key: "timestamp",
      label: "When",
      render: (event) => (
        <span className="text-muted-foreground">
          {formatDateTime(event.created_at)}
        </span>
      ),
      searchValue: (event) => event.created_at,
    },
  ];


  if (loading && events.length === 0) {
    return <ActivitySkeleton />;
  }

  if (isFreePlan) {
    return (
      <section className="py-10">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
            <ActivityIcon className="size-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Unlock portal activity
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upgrade to Pro to view internal and external activity history. We
            store up to {eventLimit} recent events per organisation.
          </p>
          <div className="mt-5">
            <Button asChild>
              <Link href={SETTINGS_ROUTES.BILLING}>Upgrade to Pro</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    const isForbidden = error instanceof ServiceError && error.status === 403;

    return (
      <section className="space-y-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {isForbidden ? "Upgrade required" : "Unable to load activity"}
            </CardTitle>
            <CardDescription>
              {isForbidden
                ? "Your current subscription does not include activity history."
                : error.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isForbidden ? (
                <Button asChild>
                  <Link href={SETTINGS_ROUTES.BILLING}>Upgrade to Pro</Link>
                </Button>
              ) : (
                <Button onClick={() => void refresh()} variant="outline" disabled={refreshDisabled}>
                  <RefreshCcwIcon className="size-4" />
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4 py-6">
      <SalkaroTable
        rows={events}
        columns={columns}
        rowKey={(event) => event.id}
        headerRight={
          <Button
            onClick={() => void refresh()}
            variant="outline"
            size="icon-sm"
            aria-label="Refresh activity"
            disabled={refreshDisabled}
          >
            <RefreshCcwIcon
              className={`size-3 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        }
        searchable
        searchPlaceholder="Search activity..."
        filterBy={["event", "actor", "portal"]}
        emptyMessage="No activity yet."
      />
    </section>
  );
}
