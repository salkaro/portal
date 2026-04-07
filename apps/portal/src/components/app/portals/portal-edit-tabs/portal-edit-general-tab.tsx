"use client";

import { Input } from "@salkaro/ui";
import { Label } from "@salkaro/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@salkaro/ui";

type PortalEditGeneralTabProps = {
  name: string;
  status: "draft" | "active";
  onNameChange: (value: string) => void;
  onStatusChange: (value: "draft" | "active") => void;
  disabled?: boolean;
};

export function PortalEditGeneralTab({
  name,
  status,
  onNameChange,
  onStatusChange,
  disabled,
}: PortalEditGeneralTabProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="edit-portal-name">Name</Label>
        <Input
          id="edit-portal-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Portal name"
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as "draft" | "active")}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <span className="flex items-center gap-2">
              {status === "active" ? (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                </span>
              ) : (
                <span className="size-2 rounded-full bg-blue-500" />
              )}
              {status === "active" ? "Live" : "Draft"}
            </span>
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" sideOffset={4}>
            <SelectItem value="draft">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-500" />
                Draft
              </span>
            </SelectItem>
            <SelectItem value="active">
              <span className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                </span>
                Live
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
