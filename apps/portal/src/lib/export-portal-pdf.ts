import type { PortalBoardData, PortalItem } from "@/types/portal-view";
import {
  getCompletionStats,
  getOverdueItems,
  getStatusCounts,
} from "@/utils/portal-view";

type Customization = {
  tagline: string | null;
  showStatusSection: boolean;
  showTimelineSection: boolean;
  showOwnersSection: boolean;
  logoUrl?: string | null;
  primaryColor?: string | null;
  hidePdfBranding?: boolean;
} | null;

const STATUS_DONE_LABELS = ["done", "complete", "completed", "closed", "finished"];
const STATUS_IN_PROGRESS_LABELS = ["in progress", "working on it", "in review", "stuck"];

// Default teal accent — matches Salkaro's primary teal
const DEFAULT_ACCENT: [number, number, number] = [13, 148, 136]; // teal-600

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function isStatusDone(label: string) {
  return STATUS_DONE_LABELS.includes(label.toLowerCase().trim());
}
function isStatusInProgress(label: string) {
  return STATUS_IN_PROGRESS_LABELS.includes(label.toLowerCase().trim());
}

function formatDate(text: string): string {
  if (!text) return "—";
  const dateStr = text.includes(" - ") ? text.split(" - ")[1] : text;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return text;
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

function formatTimeline(text: string): string {
  if (!text) return "—";
  if (!text.includes(" - ")) return formatDate(text);
  const [start, end] = text.split(" - ");
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return text;
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(s)} – ${fmt(e)}`;
}

function getCellText(type: string, text: string): string {
  if (!text) return "—";
  if (type === "date") return formatDate(text);
  if (type === "timeline") return formatTimeline(text);
  return text;
}

function getItemStatus(item: PortalItem): string {
  if (item.subitems.length > 0) {
    const subDone = item.subitems.filter((s) => isStatusDone(s.status ?? "")).length;
    if (subDone === item.subitems.length) return "Done";
    return "In Progress";
  }
  return item.columnValues.find((cv) => cv.type === "status")?.text?.trim() || "No status";
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Palette
const COLORS = {
  primary: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  mutedBg: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
};

function statusColor(label: string): [number, number, number] {
  if (isStatusDone(label)) return COLORS.green;
  if (isStatusInProgress(label)) return COLORS.blue;
  if (label === "No status") return COLORS.muted;
  return COLORS.amber;
}

/** Lightens an RGB colour toward white by `amount` (0–1) */
function lighten(color: [number, number, number], amount: number): [number, number, number] {
  return [
    Math.round(color[0] + (255 - color[0]) * amount),
    Math.round(color[1] + (255 - color[1]) * amount),
    Math.round(color[2] + (255 - color[2]) * amount),
  ];
}

export async function exportPortalPdf(
  portalName: string,
  customization: Customization,
  data: PortalBoardData,
  isPro = false,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  // Resolve accent colour
  const rawColor = customization?.primaryColor;
  const accent: [number, number, number] =
    isPro && rawColor ? (hexToRgb(rawColor) ?? DEFAULT_ACCENT) : DEFAULT_ACCENT;

  const accentLight = lighten(accent, 0.75);

  // Load logo if Pro and logoUrl provided
  const logoDataUrl =
    isPro && customization?.logoUrl
      ? await loadImageAsDataUrl(customization.logoUrl)
      : null;

  const hideBranding = isPro && (customization?.hidePdfBranding ?? false);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── helpers ────────────────────────────────────────────────────────────────

  const addPageIfNeeded = (needed = 20) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionHeading = (text: string) => {
    addPageIfNeeded(14);
    doc.setFillColor(...COLORS.mutedBg);
    doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.text(text.toUpperCase(), margin + 3, y + 5.5);
    y += 12;
  };

  const pill = (text: string, x: number, py: number, color: [number, number, number]) => {
    const pillW = doc.getTextWidth(text) + 6;
    const pillH = 5;
    doc.setFillColor(color[0], color[1], color[2], 0.12);
    doc.roundedRect(x, py - 3.5, pillW, pillH, 1, 1, "F");
    doc.setTextColor(...color);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(text, x + 3, py);
    return pillW;
  };

  // ── Header bar ─────────────────────────────────────────────────────────────

  doc.setFillColor(...accent);
  doc.rect(0, 0, pageW, 28, "F");

  // Logo top-right (Pro only)
  const logoSize = 16;
  const logoX = pageW - margin - logoSize;
  const logoY = 6;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "JPEG", logoX, logoY, logoSize, logoSize);
    } catch {
      // ignore if image fails
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.text(portalName, margin, 13);

  if (customization?.tagline) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...accentLight);
    doc.text(customization.tagline, margin, 21);
  }

  // Date stamp
  const dateStr = new Date().toLocaleDateString("en-GB", {
    month: "long", day: "numeric", year: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...accentLight);
  const dateX = logoDataUrl ? logoX - 3 : pageW - margin;
  doc.text(`Exported ${dateStr}`, dateX, 21, { align: "right" });

  y = 36;

  // ── Summary stat cards ─────────────────────────────────────────────────────

  const stats = getCompletionStats(data.items);
  const overdue = getOverdueItems(data.items).length;

  const cards: { label: string; value: string | number; color: [number, number, number] }[] = [
    { label: "Total items", value: stats.total, color: COLORS.primary },
    { label: "Complete", value: stats.done, color: COLORS.green },
    { label: "In progress", value: stats.inProgress, color: COLORS.blue },
    { label: "Overall", value: `${stats.donePercent}%`, color: accent },
    { label: "Overdue", value: overdue, color: overdue > 0 ? COLORS.red : COLORS.muted },
  ];

  const cardW = (contentW - 4 * 4) / 5;
  cards.forEach((card, i) => {
    const cx = margin + i * (cardW + 4);
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(cx, y, cardW, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...card.color);
    doc.text(String(card.value), cx + cardW / 2, y + 10, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(card.label, cx + cardW / 2, y + 15, { align: "center" });
  });

  y += 26;

  // ── Status breakdown ───────────────────────────────────────────────────────

  const showStatus = customization?.showStatusSection ?? true;
  if (showStatus) {
    const counts = getStatusCounts(data.items);
    if (counts.length > 0) {
      sectionHeading("Status breakdown");

      counts.forEach((sc) => {
        addPageIfNeeded(8);
        const pct = stats.total > 0 ? sc.count / stats.total : 0;
        const color = statusColor(sc.label);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...COLORS.primary);
        doc.text(sc.label, margin, y);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...COLORS.muted);
        doc.text(`${sc.count}`, pageW - margin, y, { align: "right" });

        const barY = y + 2;
        const barH = 2.5;
        const barMaxW = contentW - 30;
        doc.setFillColor(...COLORS.border);
        doc.roundedRect(margin, barY, barMaxW, barH, 1, 1, "F");
        doc.setFillColor(...color);
        doc.roundedRect(margin, barY, Math.max(barMaxW * pct, 1), barH, 1, 1, "F");

        y += 9;
      });

      y += 4;
    }
  }

  // ── Items by group ─────────────────────────────────────────────────────────

  const groupOrder: string[] = [];
  const groupMap = new Map<string, { title: string; items: PortalItem[] }>();
  for (const item of data.items) {
    if (!groupMap.has(item.groupId)) {
      groupOrder.push(item.groupId);
      groupMap.set(item.groupId, { title: item.groupTitle, items: [] });
    }
    groupMap.get(item.groupId)!.items.push(item);
  }

  const visibleColumns = data.columns.slice(0, 4);

  for (const groupId of groupOrder) {
    const group = groupMap.get(groupId)!;
    const groupStats = getCompletionStats(group.items);

    const estimatedHeight = 12 + 10 + Math.min(group.items.length, 2) * 10;
    if (y + estimatedHeight > pageH - margin) {
      doc.addPage();
      y = margin;
    }

    sectionHeading(`${group.title}  ·  ${group.items.length} items  ·  ${groupStats.donePercent}% complete`);

    const head = [["Item", "Status", ...visibleColumns.map((c) => c.title)]];

    const body = group.items.map((item) => {
      const status = getItemStatus(item);
      const subInfo = item.subitems.length > 0
        ? ` (${item.subitems.filter((s) => isStatusDone(s.status ?? "")).length}/${item.subitems.length} subtasks)`
        : "";
      return [
        item.name + subInfo,
        status,
        ...visibleColumns.map((col) => {
          const cv = item.columnValues.find((v) => v.columnId === col.id);
          return getCellText(col.type, cv?.text ?? "");
        }),
      ];
    });

    autoTable(doc, {
      startY: y,
      head,
      body,
      rowPageBreak: "avoid",
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        textColor: COLORS.primary,
        lineColor: COLORS.border,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: COLORS.mutedBg,
        textColor: COLORS.muted,
        fontStyle: "bold",
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [250, 251, 252] as [number, number, number],
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 28 },
      },
      didParseCell(hookData) {
        if (hookData.section === "body" && hookData.column.index === 1) {
          const label = String(hookData.cell.raw ?? "");
          hookData.cell.styles.textColor = statusColor(label);
          hookData.cell.styles.fontStyle = "bold";
        }
      },
      didDrawPage() {
        y = margin;
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Footer on every page ───────────────────────────────────────────────────

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 10, pageW - margin, pageH - 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(portalName, margin, pageH - 6);

    const rightText = hideBranding
      ? `Page ${i} of ${totalPages}`
      : `Page ${i} of ${totalPages}  ·  Generated by Salkaro Portals`;
    doc.text(rightText, pageW - margin, pageH - 6, { align: "right" });
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  const filename = `${portalName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_status_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
