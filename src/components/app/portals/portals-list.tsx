"use client";

import { useState } from "react";
import {
  MoreHorizontalIcon,
  PencilIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deletePortal, updatePortalName, updatePortalStatus } from "@/services/supabase/portals";
import type { Portal } from "@/types/portal";
import { formatDateTime } from "@/utils/format-dates";
import { PortalAccessDialog } from "@/components/app/portals/portal-access-dialog";

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
  const [pendingDeletePortal, setPendingDeletePortal] = useState<Portal | null>(
    null,
  );
  const [deletingPortalId, setDeletingPortalId] = useState<string | null>(null);
  const [editingPortal, setEditingPortal] = useState<Portal | null>(null);
  const [accessPortal, setAccessPortal] = useState<Portal | null>(null);
  const [portalNameDraft, setPortalNameDraft] = useState("");
  const [renamingPortalId, setRenamingPortalId] = useState<string | null>(null);
  const [portalStatusDraft, setPortalStatusDraft] = useState<'draft' | 'active'>('draft');

  async function handleDeletePortal() {
    if (!pendingDeletePortal) {
      return;
    }

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

  async function handleEditPortal() {
    if (!editingPortal) return;

    const nextName = portalNameDraft.trim();
    if (!nextName) {
      toast.error("Please enter a portal name.");
      return;
    }

    setRenamingPortalId(editingPortal.id);

    const [nameResult, statusResult] = await Promise.all([
      updatePortalName({ organisationId, portalId: editingPortal.id, name: nextName }),
      portalStatusDraft !== editingPortal.status
        ? updatePortalStatus({ organisationId, portalId: editingPortal.id, status: portalStatusDraft })
        : Promise.resolve({ error: null }),
    ]);

    if (nameResult.error) {
      toast.error(nameResult.error.message);
      setRenamingPortalId(null);
      return;
    }

    if (statusResult.error) {
      toast.error(statusResult.error.message);
      setRenamingPortalId(null);
      return;
    }

    toast.success("Portal updated.");
    setEditingPortal(null);
    setPortalNameDraft("");
    setRenamingPortalId(null);
    await onChanged();
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Portal</TableHead>
              <TableHead>Board</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {portals.map((portal) => (
              <TableRow key={portal.id}>
                <TableCell className="font-medium">{portal.name}</TableCell>
                <TableCell>{portal.import_config.boardName}</TableCell>
                <TableCell>
                  {portal.import_config.selectedColumnIds.length}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {portal.status === 'active' && (
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                      </span>
                    )}
                    <Badge variant="outline" className={`capitalize ${portal.status === 'active' ? 'border-green-500/40 bg-green-500/10 text-green-600' : ''}`}>
                      {portal.status === 'active' ? 'Live' : 'Draft'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(portal.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Portal actions"
                      >
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setAccessPortal(portal)}>
                        <ShieldCheckIcon />
                        Access
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingPortal(portal);
                          setPortalNameDraft(portal.name);
                          setPortalStatusDraft(portal.status === 'active' ? 'active' : 'draft');
                        }}
                      >
                        <PencilIcon />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setPendingDeletePortal(portal)}
                      >
                        <Trash2Icon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={pendingDeletePortal !== null}
        onOpenChange={(open) => {
          if (!open && deletingPortalId === null) {
            setPendingDeletePortal(null);
          }
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
              onClick={(event) => {
                event.preventDefault();
                void handleDeletePortal();
              }}
            >
              {deletingPortalId !== null ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={editingPortal !== null}
        onOpenChange={(open) => {
          if (!open && renamingPortalId === null) {
            setEditingPortal(null);
            setPortalNameDraft("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit portal</DialogTitle>
            <DialogDescription>
              Update the portal name shown in your workspace and client list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="portal-name">Name</Label>
              <Input
                id="portal-name"
                value={portalNameDraft}
                onChange={(event) => setPortalNameDraft(event.target.value)}
                placeholder="Portal name"
                disabled={renamingPortalId !== null}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={portalStatusDraft}
                onValueChange={(v) => setPortalStatusDraft(v as 'draft' | 'active')}
                disabled={renamingPortalId !== null}
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingPortal(null);
                setPortalNameDraft("");
              }}
              disabled={renamingPortalId !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleEditPortal()}
              disabled={renamingPortalId !== null}
            >
              {renamingPortalId !== null ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
