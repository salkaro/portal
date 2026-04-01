"use client";

import { useEffect, useState } from "react";
import {
  MoreHorizontalIcon,
  PencilIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalkaroTable, type SalkaroColumn } from "@/components/ui/salkaro-table";
import { Textarea } from "@/components/ui/textarea";
import {
  deletePortal,
  updatePortalCustomization,
  updatePortalImportConfig,
  updatePortalName,
  updatePortalStatus,
} from "@/services/supabase/portals";
import { isMondayImportableColumnType } from "@/constants/portals";
import { useMondaySource } from "@/hooks/use-monday-source";
import type { Portal } from "@/types/portal";
import { formatDateTime } from "@/utils/format-dates";
import { PortalAccessDialog } from "@/components/app/portals/portal-access-dialog";
import { limitInput } from "@/utils/string";

type PortalsListProps = {
  organisationId: string;
  portals: Portal[];
  onChanged: () => Promise<void>;
};

export function PortalsList({
  organisationId,
  portals,
  onChanged,
}: PortalsListProps) {
  const [pendingDeletePortal, setPendingDeletePortal] = useState<Portal | null>(null);
  const [deletingPortalId, setDeletingPortalId] = useState<string | null>(null);
  const [editingPortal, setEditingPortal] = useState<Portal | null>(null);
  const [accessPortal, setAccessPortal] = useState<Portal | null>(null);
  const [saving, setSaving] = useState(false);

  // General tab
  const [portalNameDraft, setPortalNameDraft] = useState("");
  const [portalStatusDraft, setPortalStatusDraft] = useState<"draft" | "active">("draft");

  // Fields tab
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);
  const { columns, loadingColumns, loadColumns } = useMondaySource();

  // Display tab
  const [tagline, setTagline] = useState("");
  const [showStatusSection, setShowStatusSection] = useState(true);
  const [showTimelineSection, setShowTimelineSection] = useState(true);
  const [showOwnersSection, setShowOwnersSection] = useState(false);

  // Load columns when edit dialog opens
  useEffect(() => {
    if (!editingPortal) return;
    const { connection_id, import_config } = editingPortal;
    void loadColumns(connection_id, import_config.boardId);
  }, [editingPortal, loadColumns]);

  function openEdit(portal: Portal) {
    setEditingPortal(portal);
    setPortalNameDraft(portal.name);
    setPortalStatusDraft(portal.status === "active" ? "active" : "draft");
    setSelectedColumnIds(portal.import_config.selectedColumnIds);
    setTagline(portal.customization.tagline ?? "");
    setShowStatusSection(portal.customization.showStatusSection);
    setShowTimelineSection(portal.customization.showTimelineSection);
    setShowOwnersSection(portal.customization.showOwnersSection);
  }

  function closeEdit() {
    setEditingPortal(null);
  }

  async function handleSave() {
    if (!editingPortal) return;

    const nextName = portalNameDraft.trim();
    if (!nextName) {
      toast.error("Please enter a portal name.");
      return;
    }
    if (selectedColumnIds.length === 0) {
      toast.error("Please select at least one field.");
      return;
    }

    setSaving(true);

    const [nameResult, statusResult, fieldsResult, displayResult] = await Promise.all([
      updatePortalName({ organisationId, portalId: editingPortal.id, name: nextName }),
      portalStatusDraft !== editingPortal.status
        ? updatePortalStatus({ organisationId, portalId: editingPortal.id, status: portalStatusDraft })
        : Promise.resolve({ error: null }),
      updatePortalImportConfig({
        organisationId,
        portalId: editingPortal.id,
        importConfig: {
          ...editingPortal.import_config,
          selectedColumnIds,
        },
      }),
      updatePortalCustomization({
        organisationId,
        portalId: editingPortal.id,
        customization: {
          tagline: tagline.trim() || null,
          showStatusSection,
          showTimelineSection,
          showOwnersSection,
        },
      }),
    ]);

    setSaving(false);

    const firstError =
      nameResult.error ?? statusResult.error ?? fieldsResult.error ?? displayResult.error;
    if (firstError) {
      toast.error(firstError.message);
      return;
    }

    toast.success("Portal updated.");
    closeEdit();
    await onChanged();
  }

  async function handleDeletePortal() {
    if (!pendingDeletePortal) return;

    setDeletingPortalId(pendingDeletePortal.id);

    const result = await deletePortal({
      organisationId,
      portalId: pendingDeletePortal.id,
    });

    if (result.error) {
      toast.error(result.error.message);
      setDeletingPortalId(null);
      return;
    }

    toast.success("Portal deleted.");
    setPendingDeletePortal(null);
    setDeletingPortalId(null);
    await onChanged();
  }

  const importableColumns = columns.filter((col) =>
    isMondayImportableColumnType(col.type)
  );

  const portalColumns: SalkaroColumn<Portal>[] = [
    {
      key: "name",
      label: "Portal",
      render: (p) => <span className="font-medium">{p.name}</span>,
      searchValue: (p) => p.name,
    },
    {
      key: "board",
      label: "Board",
      render: (p) => p.import_config.boardName,
      searchValue: (p) => p.import_config.boardName,
    },
    {
      key: "fields",
      label: "Fields",
      render: (p) => p.import_config.selectedColumnIds.length,
    },
    {
      key: "status",
      label: "Status",
      render: (p) => (
        <div className="flex items-center gap-2">
          {p.status === "active" && (
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
          )}
          <Badge
            variant="outline"
            className={`capitalize ${p.status === "active" ? "border-green-500/40 bg-green-500/10 text-green-600" : ""}`}
          >
            {p.status === "active" ? "Live" : "Draft"}
          </Badge>
        </div>
      ),
      searchValue: (p) => (p.status === "active" ? "live" : "draft"),
    },
    {
      key: "created",
      label: "Created",
      render: (p) => <span className="text-muted-foreground">{formatDateTime(p.created_at)}</span>,
    },
    {
      key: "actions",
      label: "",
      className: "w-12 text-right",
      render: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Portal actions">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setAccessPortal(p)}>
              <ShieldCheckIcon />
              Access
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEdit(p)}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPendingDeletePortal(p)}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <SalkaroTable
        rows={portals}
        columns={portalColumns}
        rowKey={(p) => p.id}
        searchable
        searchPlaceholder="Search portals..."
        filterBy={["name", "board", "status"]}
        emptyMessage="No portals found."
      />

      {/* Edit dialog */}
      <Dialog
        open={editingPortal !== null}
        onOpenChange={(open) => {
          if (!open && !saving) closeEdit();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit portal</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="general" className="flex-1">
                General
              </TabsTrigger>
              <TabsTrigger value="fields" className="flex-1">
                Fields
              </TabsTrigger>
              <TabsTrigger value="display" className="flex-1">
                Sections
              </TabsTrigger>
            </TabsList>

            {/* General */}
            <TabsContent value="general" className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label htmlFor="edit-portal-name">Name</Label>
                <Input
                  id="edit-portal-name"
                  value={portalNameDraft}
                  onChange={(e) => setPortalNameDraft(e.target.value)}
                  placeholder="Portal name"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={portalStatusDraft}
                  onValueChange={(v) =>
                    setPortalStatusDraft(v as "draft" | "active")
                  }
                  disabled={saving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Fields */}
            <TabsContent value="fields" className="pt-3">
              <div className="space-y-2">
                <Label>Fields to display</Label>
                <p className="text-xs text-muted-foreground">
                  Board: {editingPortal?.import_config.boardName}
                </p>
                {loadingColumns ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Spinner className="size-4" />
                    Loading fields...
                  </div>
                ) : importableColumns.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No importable fields found.
                  </p>
                ) : (
                  <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                    {importableColumns.map((col) => (
                      <label
                        key={col.id}
                        className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/60 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedColumnIds.includes(col.id)}
                          disabled={saving}
                          onCheckedChange={(checked) => {
                            setSelectedColumnIds((prev) =>
                              checked
                                ? [...prev, col.id]
                                : prev.filter((id) => id !== col.id),
                            );
                          }}
                        />
                        <div className="text-xs">
                          <p className="text-foreground">{col.title}</p>
                          <p className="text-muted-foreground">{col.type}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Sections */}
            <TabsContent value="display" className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label htmlFor="edit-tagline">Tagline</Label>
                <p className="text-xs text-muted-foreground">
                  Shown below the portal name on the client view.
                </p>
                <Textarea
                  id="edit-tagline"
                  value={tagline}
                  onChange={(e) => setTagline(limitInput(e.target.value, 64))}
                  placeholder="e.g. Q2 project progress — updated weekly"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2 rounded-md border border-border p-3">
                <p className="text-xs font-medium">Visible sections</p>
                <p className="text-xs text-muted-foreground">
                  Toggle the summary sections shown above the items table.
                </p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-show-status">Status updates</Label>
                  <Switch
                    id="edit-show-status"
                    checked={showStatusSection}
                    onCheckedChange={setShowStatusSection}
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-show-timeline">Timeline</Label>
                  <Switch
                    id="edit-show-timeline"
                    checked={showTimelineSection}
                    onCheckedChange={setShowTimelineSection}
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-show-owners">Owners</Label>
                  <Switch
                    id="edit-show-owners"
                    checked={showOwnersSection}
                    onCheckedChange={setShowOwnersSection}
                    disabled={saving}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <>
                  <Spinner className="size-4" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={pendingDeletePortal !== null}
        onOpenChange={(open) => {
          if (!open && deletingPortalId === null) setPendingDeletePortal(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete portal?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeletePortal
                ? `This will permanently remove ${pendingDeletePortal.name}.`
                : "This will permanently remove this portal."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPortalId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={
                pendingDeletePortal === null || deletingPortalId !== null
              }
              onClick={(e) => {
                e.preventDefault();
                void handleDeletePortal();
              }}
            >
              {deletingPortalId !== null ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PortalAccessDialog
        key={`${accessPortal?.id ?? "none"}-${accessPortal ? "open" : "closed"}`}
        open={accessPortal !== null}
        organisationId={organisationId}
        portal={accessPortal}
        onClose={() => setAccessPortal(null)}
        onUpdated={onChanged}
      />
    </>
  );
}
