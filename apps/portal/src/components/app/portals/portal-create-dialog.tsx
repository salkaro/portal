"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { limitInput } from "@/utils/string";
import { toast } from "sonner";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
} from "lucide-react";
import {
  PORTAL_CREATION_STEP_LABELS,
  PORTAL_CREATION_STEPS,
  PORTAL_DEFAULT_NAME,
  isMondayImportableColumnType,
} from "@/constants/portals";
import { Button } from "@salkaro/ui";
import { Checkbox } from "@salkaro/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@salkaro/ui";
import { Input } from "@salkaro/ui";
import { Label } from "@salkaro/ui";
import { Progress } from "@salkaro/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@salkaro/ui";
import { Spinner } from "@salkaro/ui";
import { Switch } from "@salkaro/ui";
import { Textarea } from "@salkaro/ui";
import { usePortalSource } from "@/hooks/use-portal-source";
import { createPortal } from "@/services/supabase/portals";
import type { ConnectedAccount } from "@/services/supabase/connections";
import { getConnectionDisplayName } from "@/utils/connections";

type PortalCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationId: string;
  connections: ConnectedAccount[];
  onCreated: () => Promise<void>;
};

export function PortalCreateDialog({
  open,
  onOpenChange,
  organisationId,
  connections,
  onCreated,
}: PortalCreateDialogProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [portalName, setPortalName] = useState(PORTAL_DEFAULT_NAME);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [selectedSubBoardId, setSelectedSubBoardId] = useState<string>("");
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);
  const [tagline, setTagline] = useState("");
  const [projectOwner, setProjectOwner] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [showStatusSection, setShowStatusSection] = useState(true);
  const [showTimelineSection, setShowTimelineSection] = useState(true);
  const [showOwnersSection, setShowOwnersSection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    boards,
    subBoards,
    columns,
    loadingBoards,
    loadingSubBoards,
    loadingColumns,
    errorMessage,
    loadBoards,
    loadSubBoards,
    loadColumns,
  } = usePortalSource();

  const progressValue =
    ((currentStepIndex + 1) / PORTAL_CREATION_STEPS.length) * 100;
  const isLastStep = currentStepIndex === PORTAL_CREATION_STEPS.length - 1;

  const selectedConnection = useMemo(
    () => connections.find((c) => c.id === selectedConnectionId) ?? null,
    [connections, selectedConnectionId]
  );

  const selectedBoardName = useMemo(
    () => boards.find((b) => b.id === selectedBoardId)?.name ?? "Unknown board",
    [boards, selectedBoardId]
  );

  const selectedSubBoardName = useMemo(
    () => subBoards.find((b) => b.id === selectedSubBoardId)?.name ?? null,
    [subBoards, selectedSubBoardId]
  );

  const isLinear = selectedConnection?.provider === "linear";

  const importableColumns = useMemo(() => {
    // Monday has typed columns — only import relevant types.
    // All other providers (Linear etc.) expose only relevant columns already.
    if (selectedConnection?.provider === "monday") {
      return columns.filter((column) =>
        isMondayImportableColumnType(column.type)
      );
    }
    return columns;
  }, [columns, selectedConnection]);

  const canContinue = useMemo(() => {
    const step = PORTAL_CREATION_STEPS[currentStepIndex];

    if (step === "connection") return selectedConnectionId.length > 0;
    if (step === "source") {
      if (!selectedBoardId) return false;
      // For Linear, project selection is required only when projects exist
      if (isLinear && subBoards.length > 0 && !selectedSubBoardId) return false;
      return true;
    }
    if (step === "import") return selectedColumnIds.length > 0;
    return portalName.trim().length > 0;
  }, [
    currentStepIndex,
    isLinear,
    portalName,
    selectedBoardId,
    selectedSubBoardId,
    subBoards.length,
    selectedColumnIds.length,
    selectedConnectionId,
  ]);

  function handleClose() {
    setCurrentStepIndex(0);
    setPortalName(PORTAL_DEFAULT_NAME);
    setSelectedConnectionId("");
    setSelectedBoardId("");
    setSelectedSubBoardId("");
    setSelectedColumnIds([]);
    setTagline("");
    setProjectOwner("");
    setOrganisationName("");
    setShowStatusSection(true);
    setShowTimelineSection(true);
    setShowOwnersSection(false);
    setSaveError(null);
    onOpenChange(false);
  }

  async function handleSelectConnection(connectionId: string) {
    setSelectedConnectionId(connectionId);
    setSelectedBoardId("");
    setSelectedSubBoardId("");
    setSelectedColumnIds([]);
    await loadBoards(connectionId);
  }

  async function handleSelectBoard(boardId: string) {
    setSelectedBoardId(boardId);
    setSelectedSubBoardId("");
    setSelectedColumnIds([]);
    if (!selectedConnectionId) return;
    if (isLinear) {
      await loadSubBoards(selectedConnectionId, boardId);
    } else {
      await loadColumns(selectedConnectionId, boardId, "");
    }
  }

  async function handleSelectSubBoard(subBoardId: string) {
    setSelectedSubBoardId(subBoardId);
    setSelectedColumnIds([]);
    if (!selectedConnectionId || !selectedBoardId) return;
    await loadColumns(selectedConnectionId, selectedBoardId, subBoardId, true);
  }

  async function handleSubmit() {
    if (
      !selectedConnectionId ||
      !selectedBoardId ||
      selectedColumnIds.length === 0
    ) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    const result = await createPortal({
      organisationId,
      connectionId: selectedConnectionId,
      provider: selectedConnection?.provider ?? "monday",
      name: portalName.trim(),
      importConfig: {
        boardId: selectedBoardId,
        boardName: selectedBoardName,
        selectedColumnIds,
        subBoardId: selectedSubBoardId || null,
        subBoardName: selectedSubBoardName,
      },
      customization: {
        tagline: tagline.trim() || null,
        projectOwner: projectOwner.trim() || null,
        organisationName: organisationName.trim() || null,
        showStatusSection,
        showTimelineSection,
        showOwnersSection,
      },
    });

    if (result.error) {
      setSaveError(result.error.message);
      setSaving(false);
      return;
    }

    await onCreated();
    toast.success("Portal created");
    setSaving(false);
    handleClose();
  }

  const boardLabel =
    selectedConnection?.provider === "linear" ? "team" : "board";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="sm:max-w-xl flex flex-col max-h-[90vh]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Create portal</DialogTitle>
          <DialogDescription>
            Choose a connection, select a source, then customize your portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Progress value={progressValue} />
          <p className="text-xs text-muted-foreground">
            Step {currentStepIndex + 1} of {PORTAL_CREATION_STEPS.length}:{" "}
            {
              PORTAL_CREATION_STEP_LABELS[
                PORTAL_CREATION_STEPS[currentStepIndex]
              ]
            }
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {PORTAL_CREATION_STEPS[currentStepIndex] === "connection" ? (
          <div className="space-y-2">
            <Label>Connection</Label>
            {connections.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                <p>No connections found.</p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link href="/integrations/browse">
                    <LinkIcon className="size-4" />
                    Connect an integration
                  </Link>
                </Button>
              </div>
            ) : (
              <Select
                value={selectedConnectionId}
                onValueChange={(value) => void handleSelectConnection(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((connection) => (
                    <SelectItem key={connection.id} value={connection.id}>
                      {getConnectionDisplayName(connection)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : null}

        {PORTAL_CREATION_STEPS[currentStepIndex] === "source" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Choose {boardLabel}</Label>
              {loadingBoards ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Spinner className="size-4" />
                  Loading {boardLabel}s...
                </div>
              ) : (
                <Select
                  value={selectedBoardId}
                  onValueChange={(value) => void handleSelectBoard(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Select ${boardLabel}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map((board) => (
                      <SelectItem key={board.id} value={board.id}>
                        {board.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {isLinear && selectedBoardId ? (
              <div className="space-y-2">
                <Label>Choose project</Label>
                {loadingSubBoards ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Spinner className="size-4" />
                    Loading projects...
                  </div>
                ) : subBoards.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No projects found for this team.
                  </p>
                ) : (
                  <Select
                    value={selectedSubBoardId}
                    onValueChange={(value) => void handleSelectSubBoard(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {subBoards.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {PORTAL_CREATION_STEPS[currentStepIndex] === "import" ? (
          <div className="space-y-2">
            <Label>Choose fields to import</Label>
            {loadingColumns ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Spinner className="size-4" />
                Loading fields...
              </div>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-border p-2">
                {importableColumns.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No importable fields available for this {boardLabel}.
                  </p>
                ) : (
                  importableColumns.map((column) => (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/60"
                    >
                      <Checkbox
                        checked={selectedColumnIds.includes(column.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedColumnIds((current) => [
                              ...current,
                              column.id,
                            ]);
                            return;
                          }

                          setSelectedColumnIds((current) =>
                            current.filter(
                              (columnId) => columnId !== column.id,
                            ),
                          );
                        }}
                      />
                      <div className="text-xs">
                        <p className="text-foreground">{column.title}</p>
                        <p className="text-muted-foreground">{column.type}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        ) : null}

        {PORTAL_CREATION_STEPS[currentStepIndex] === "customize" ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="portal-name">Portal name</Label>
              <Input
                id="portal-name"
                value={portalName}
                onChange={(event) => setPortalName(limitInput(event.target.value, 64))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portal-tagline">Tagline</Label>
              <Textarea
                id="portal-tagline"
                value={tagline}
                onChange={(event) => setTagline(limitInput(event.target.value, 64))}
                placeholder="A concise project summary your client will see at the top of the portal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portal-project-owner">Project owner</Label>
              <Input
                id="portal-project-owner"
                value={projectOwner}
                onChange={(e) => setProjectOwner(limitInput(e.target.value, 64))}
                placeholder="e.g. Jane Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portal-org-name">Agency name</Label>
              <Input
                id="portal-org-name"
                value={organisationName}
                onChange={(e) => setOrganisationName(limitInput(e.target.value, 64))}
                placeholder="e.g. Salkaro Agency"
              />
            </div>

            <div className="space-y-2 rounded-md border border-border p-3">
              <p className="text-xs font-medium text-foreground">
                Visible sections
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-status">Status updates</Label>
                <Switch
                  id="show-status"
                  checked={showStatusSection}
                  onCheckedChange={setShowStatusSection}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-timeline">Timeline</Label>
                <Switch
                  id="show-timeline"
                  checked={showTimelineSection}
                  onCheckedChange={setShowTimelineSection}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-owners">Owners</Label>
                <Switch
                  id="show-owners"
                  checked={showOwnersSection}
                  onCheckedChange={setShowOwnersSection}
                />
              </div>
            </div>

            <div className="rounded-md border border-dashed border-border p-3 text-xs">
              <p className="font-medium text-foreground">Preview summary</p>
              <p className="mt-1 text-muted-foreground">
                {boardLabel.charAt(0).toUpperCase() + boardLabel.slice(1)}: {selectedBoardName}
              </p>
              <p className="text-muted-foreground">
                Imported fields: {selectedColumnIds.length}
              </p>
              <p className="text-muted-foreground">
                Sections enabled:{" "}
                {
                  [
                    showStatusSection,
                    showTimelineSection,
                    showOwnersSection,
                  ].filter(Boolean).length
                }
              </p>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="text-xs text-destructive">{errorMessage}</p>
        ) : null}
        {saveError ? (
          <p className="text-xs text-destructive">{saveError}</p>
        ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setCurrentStepIndex((step) => Math.max(0, step - 1))
              }
              disabled={currentStepIndex === 0 || saving}
            >
              <ChevronLeftIcon className="size-4" />
              Back
            </Button>

            {!isLastStep ? (
              <Button
                onClick={() =>
                  setCurrentStepIndex((step) =>
                    Math.min(PORTAL_CREATION_STEPS.length - 1, step + 1),
                  )
                }
                disabled={!canContinue || saving}
              >
                Next
                <ChevronRightIcon className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={() => void handleSubmit()}
                disabled={!canContinue || saving}
              >
                {saving ? (
                  <>
                    <Spinner className="size-4" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckIcon className="size-4" />
                    Create portal
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
