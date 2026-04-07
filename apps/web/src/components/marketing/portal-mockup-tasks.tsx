/**
 * Static tasks mockup matching portal-items-table.tsx exactly:
 * - Same sidebar as PortalMockup
 * - Tasks tab active in nav
 * - Table with Task / Status / Due / Owner columns
 * - StatusBadge colour logic matching the real component
 * - Group title header + search bar matching SalkaroTable
 */

import { LayoutDashboard, ListTodo, GitBranch, Activity } from "lucide-react";

const SIDEBAR_COLOR = "#0d9488";
const FG = "#ffffff";
const FG_DIM = "rgba(255,255,255,0.6)";
const FG_BORDER = "rgba(255,255,255,0.15)";
const FG_ACTIVE_BG = "rgba(255,255,255,0.2)";

const NAV = [
  { label: "Overview", icon: LayoutDashboard, active: false },
  { label: "Tasks", icon: ListTodo, active: true },
  { label: "Timeline", icon: GitBranch, active: false },
  { label: "Activity", icon: Activity, active: false },
];

type StatusKey = "done" | "in_progress" | "stuck" | "default";

const STATUS_STYLES: Record<StatusKey, string> = {
  done: "border-green-500/40 bg-green-500/10 text-green-600",
  in_progress: "border-blue-500/40 bg-blue-500/10 text-blue-600",
  stuck: "border-red-500/40 bg-red-500/10 text-red-600",
  default: "border-border bg-muted/50 text-muted-foreground",
};

function statusKey(label: string): StatusKey {
  const l = label.toLowerCase();
  if (l === "done" || l === "complete" || l === "completed") return "done";
  if (l === "in progress" || l === "working on it") return "in_progress";
  if (l === "stuck" || l === "blocked") return "stuck";
  return "default";
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[statusKey(label)]}`}>
      {label}
    </span>
  );
}

const TASKS = [
  { name: "Homepage redesign", status: "In Progress", due: "Jun 15, 2026", owner: "Sarah K." },
  { name: "Brand guidelines", status: "Done", due: "May 30, 2026", owner: "Tom R." },
  { name: "Mobile responsive pass", status: "In Progress", due: "Jun 28, 2026", owner: "Sarah K." },
  { name: "SEO audit", status: "Not Started", due: "Jul 10, 2026", owner: "James O." },
  { name: "Copy review", status: "Stuck", due: "Jun 5, 2026", owner: "Priya N." },
  { name: "Analytics setup", status: "Not Started", due: "—", owner: "Tom R." },
];

export function PortalMockupTasks() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden flex" style={{ height: 580, width: 900, minWidth: 900 }}>

      {/* ── Sidebar ── */}
      <div className="w-48 shrink-0 flex flex-col text-white" style={{ background: SIDEBAR_COLOR }}>
        <div className="p-3 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${FG_BORDER}` }}>
          <div
            className="size-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: FG_ACTIVE_BG, color: FG }}
          >
            NW
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: FG }}>Northwave Digital</div>
            <div className="text-[10px] truncate" style={{ color: FG_DIM }}>Website launch · Active</div>
          </div>
        </div>

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
          <span className="text-sm font-medium">Tasks</span>
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">Export PDF</div>
            <div className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">Refresh</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Table header — matches SalkaroTable with group title + search */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <span className="text-xs font-semibold text-foreground">Website Redesign</span>
              <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1">
                <svg className="size-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <span className="text-[10px] text-muted-foreground">Search tasks...</span>
              </div>
            </div>

            {/* Column headers */}
            <div className="grid border-b border-border bg-muted/40 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground" style={{ gridTemplateColumns: "1fr 120px 110px 120px" }}>
              <span>Task</span>
              <span>Status</span>
              <span>Due</span>
              <span>Owner</span>
            </div>

            {/* Rows */}
            {TASKS.map((task, i) => (
              <div
                key={task.name}
                className={`grid items-center px-4 py-2.5 text-xs hover:bg-muted/30 transition-colors ${i !== TASKS.length - 1 ? "border-b border-border" : ""}`}
                style={{ gridTemplateColumns: "1fr 120px 110px 120px" }}
              >
                <span className="font-medium truncate pr-4">{task.name}</span>
                <span><StatusBadge label={task.status} /></span>
                <span className="text-muted-foreground">{task.due}</span>
                <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">{task.owner}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
