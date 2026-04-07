"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { MondayBoardColumn } from "@/services/monday";

type PortalEditFieldsTabProps = {
  boardName: string;
  columns: MondayBoardColumn[];
  loadingColumns: boolean;
  selectedColumnIds: string[];
  onSelectedColumnIdsChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function PortalEditFieldsTab({
  boardName,
  columns,
  loadingColumns,
  selectedColumnIds,
  onSelectedColumnIdsChange,
  disabled,
}: PortalEditFieldsTabProps) {
  return (
    <div className="space-y-2">
      <Label>Fields to display</Label>
      <p className="text-xs text-muted-foreground">Board: {boardName}</p>
      {loadingColumns ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Spinner className="size-4" />
          Loading fields...
        </div>
      ) : columns.length === 0 ? (
        <p className="text-xs text-muted-foreground">No importable fields found.</p>
      ) : (
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
          {columns.map((col) => (
            <label
              key={col.id}
              className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/60 cursor-pointer"
            >
              <Checkbox
                checked={selectedColumnIds.includes(col.id)}
                disabled={disabled}
                onCheckedChange={(checked) => {
                  onSelectedColumnIdsChange(
                    checked
                      ? [...selectedColumnIds, col.id]
                      : selectedColumnIds.filter((id) => id !== col.id)
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
  );
}
