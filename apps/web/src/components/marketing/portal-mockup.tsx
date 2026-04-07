/**
 * Static mockup that mirrors the real portal UI exactly:
 * - Teal branded sidebar (portal name, tagline, avatar initials, nav, "Powered by Salkaro")
 * - Topbar with "Overview" label + Export PDF / Refresh buttons
 * - ProgressHero card (matches portal-overview-section.tsx)
 * - 4 stat cards (Tasks, Completion, Active, Needs Attention) (matches portal-stat-cards.tsx)
 * - Status breakdown card (matches portal-status-breakdown.tsx)
 */

import { CheckCircle2, Clock, Loader2, ListTodo, LayoutDashboard, GitBranch, Activity, ListTodoIcon } from "lucide-react";

const SIDEBAR_COLOR = "#0d9488";
const FG = "#ffffff";
const FG_DIM = "rgba(255,255,255,0.6)";
const FG_BORDER = "rgba(255,255,255,0.15)";
const FG_ACTIVE_BG = "rgba(255,255,255,0.2)";

const NAV = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Tasks", icon: ListTodoIcon, active: false },
  { label: "Timeline", icon: GitBranch, active: false },
  { label: "Activity", icon: Activity, active: false },
];

// Matches demo data shape
const STATS = [
  { label: "Tasks", value: "8", sub: "Total tasks", Icon: ListTodo, iconClass: "text-muted-foreground", bar: undefined, barColor: undefined },
  { label: "Completion", value: "58%", sub: "3 of 8 tasks complete", Icon: CheckCircle2, iconClass: "text-green-500", bar: 58, barColor: "bg-green-500" },
  { label: "Active", value: "3", sub: "Currently in progress", Icon: Loader2, iconClass: "text-blue-500", bar: undefined, barColor: undefined },
  { label: "Needs Attention", value: "0", sub: "All on track", Icon: Clock, iconClass: "text-muted-foreground", bar: undefined, barColor: undefined },
];

const STATUS_COUNTS = [
  { label: "Done", count: 3, pct: 38, color: "#22c55e" },
  { label: "In Progress", count: 3, pct: 38, color: "#3b82f6" },
  { label: "Upcoming", count: 2, pct: 25, color: "#f59e0b" },
];

export function PortalMockup() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden flex" style={{ height: 540, width: 1000, minWidth: 1000 }}>

      {/* ── Sidebar ── */}
      <div className="w-48 shrink-0 flex flex-col text-white" style={{ background: SIDEBAR_COLOR }}>

        {/* Header */}
        <div className="p-3 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${FG_BORDER}` }}>
          <div
            className="size-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: FG_ACTIVE_BG, color: FG }}
          >
            AC
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: FG }}>Acme Corp Rebr...</div>
            <div className="text-[10px] truncate" style={{ color: FG_DIM }}>Q2 2026 · Active</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 p-2 flex-1">
          {NAV.map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs"
              style={active
                ? { background: FG_ACTIVE_BG, color: FG, fontWeight: 500 }
                : { color: FG_DIM }
              }
            >
              <Icon className="size-3.5 shrink-0" />
              {label}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-3 text-[10px] text-center"
          style={{ color: FG_DIM, borderTop: `1px solid ${FG_BORDER}` }}
        >
          Powered by Salkaro
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">

        {/* Topbar */}
        <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
          <span className="text-sm font-medium">Overview</span>
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">Export PDF</div>
            <div className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">Refresh</div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Progress hero — matches ProgressHero in portal-overview-section.tsx */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Project Progress</p>
                <p className="mt-0.5 text-3xl font-bold tabular-nums">58%</p>
                <p className="text-xs text-muted-foreground">3 of 8 tasks complete</p>
              </div>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600">
                On Track
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-blue-500" style={{ width: "58%" }} />
            </div>
          </div>

          {/* Stat cards — matches portal-stat-cards.tsx */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {STATS.map(({ label, value, sub, Icon, iconClass, bar, barColor }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-3 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                  <Icon className={`size-3.5 ${iconClass}`} />
                </div>
                <p className="text-xl font-bold">{value}</p>
                {bar !== undefined && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${bar}%` }} />
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>
              </div>
            ))}
          </div>

          {/* Status breakdown — matches portal-status-breakdown.tsx */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="px-4 pt-4 pb-2">
              <p className="text-sm font-semibold">Status Breakdown</p>
            </div>
            <div className="px-4 pb-4 space-y-3">
              {/* Segmented bar */}
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                {STATUS_COUNTS.map((s) => (
                  <div key={s.label} style={{ width: `${s.pct}%`, background: s.color }} />
                ))}
              </div>
              {/* Rows */}
              <div className="space-y-2 pt-1">
                {STATUS_COUNTS.map((s) => (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 text-xs text-foreground">{s.label}</span>
                    <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
                      <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                    </div>
                    <span className="w-7 text-right text-[10px] tabular-nums text-muted-foreground">{s.pct}%</span>
                    <span className="w-4 text-right text-[10px] font-medium tabular-nums">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
