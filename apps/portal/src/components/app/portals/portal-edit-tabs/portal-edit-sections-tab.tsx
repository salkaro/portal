"use client";

import { Input } from "@salkaro/ui";
import { Label } from "@salkaro/ui";
import { Switch } from "@salkaro/ui";
import { Textarea } from "@salkaro/ui";
import { limitInput } from "@/utils/string";

type PortalEditSectionsTabProps = {
  tagline: string;
  projectOwner: string;
  organisationName: string;
  showStatusSection: boolean;
  showTimelineSection: boolean;
  showOwnersSection: boolean;
  onTaglineChange: (value: string) => void;
  onProjectOwnerChange: (value: string) => void;
  onOrganisationNameChange: (value: string) => void;
  onShowStatusSectionChange: (value: boolean) => void;
  onShowTimelineSectionChange: (value: boolean) => void;
  onShowOwnersSectionChange: (value: boolean) => void;
  disabled?: boolean;
};

export function PortalEditSectionsTab({
  tagline,
  projectOwner,
  organisationName,
  showStatusSection,
  showTimelineSection,
  showOwnersSection,
  onTaglineChange,
  onProjectOwnerChange,
  onOrganisationNameChange,
  onShowStatusSectionChange,
  onShowTimelineSectionChange,
  onShowOwnersSectionChange,
  disabled,
}: PortalEditSectionsTabProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="edit-project-owner">Project owner</Label>
        <Input
          id="edit-project-owner"
          value={projectOwner}
          onChange={(e) => onProjectOwnerChange(limitInput(e.target.value, 64))}
          placeholder="e.g. Jane Smith"
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-org-name">Agency name</Label>
        <Input
          id="edit-org-name"
          value={organisationName}
          onChange={(e) => onOrganisationNameChange(limitInput(e.target.value, 64))}
          placeholder="e.g. Salkaro Agency"
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-tagline">Tagline</Label>
        <p className="text-xs text-muted-foreground">
          Shown below the portal name on the client view.
        </p>
        <Textarea
          id="edit-tagline"
          value={tagline}
          onChange={(e) => onTaglineChange(limitInput(e.target.value, 64))}
          placeholder="e.g. Q2 project progress — updated weekly"
          disabled={disabled}
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
            onCheckedChange={onShowStatusSectionChange}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="edit-show-timeline">Timeline</Label>
          <Switch
            id="edit-show-timeline"
            checked={showTimelineSection}
            onCheckedChange={onShowTimelineSectionChange}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="edit-show-owners">Owners</Label>
          <Switch
            id="edit-show-owners"
            checked={showOwnersSection}
            onCheckedChange={onShowOwnersSectionChange}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
