"use client";

import { ChevronDown, Ellipsis } from "lucide-react";
import { useActionState, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FieldErrors, FormMessage, valueFor } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleFormState, type FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { SOCIAL_PLATFORM_LABELS, SOCIAL_PLATFORMS, type SocialPlatform } from "@/modules/accounts/social";
import { AppLogo } from "@/modules/catalog/components/app-card";
import { createReferralLink } from "../actions";
import type { AllowedAppDestination } from "../queries";
import { ChannelIcon } from "./channel-icon";

const CONTROL =
  "h-11 w-full appearance-none rounded-xl border border-input bg-background pr-9 pl-3 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

/** The four channels with their own tile; every other platform sits behind "Other". */
const TILE_CHANNELS = ["tiktok", "instagram", "youtube", "x"] as const satisfies readonly SocialPlatform[];
const OTHER_CHANNELS = SOCIAL_PLATFORMS.filter(
  (platform) => !(TILE_CHANNELS as readonly SocialPlatform[]).includes(platform),
);
const isTileChannel = (channel: string) => (TILE_CHANNELS as readonly string[]).includes(channel);

export type LinkProgramOption = {
  membershipId: string;
  appName: string;
  logoUrl: string | null;
  availableDestinations: AllowedAppDestination[];
};

function invalid(state: FormState, field: string): boolean {
  return Boolean(state.status === "error" && state.fieldErrors?.[field]);
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function SelectChevron() {
  return (
    <ChevronDown
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
    />
  );
}

const TILE =
  "relative flex h-16 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-border bg-background text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground has-checked:border-primary has-checked:bg-primary/8 has-checked:text-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50";

function ChannelTiles({ channel, onChange }: { channel: string; onChange: (channel: SocialPlatform) => void }) {
  const tiles = [
    ...TILE_CHANNELS.map((platform) => ({
      value: platform,
      label: SOCIAL_PLATFORM_LABELS[platform],
      checked: channel === platform,
      icon: <ChannelIcon channel={platform} size="md" />,
    })),
    {
      value: "other",
      label: "Other",
      checked: !isTileChannel(channel),
      icon: (
        <span aria-hidden className="grid size-6 place-items-center rounded-[7px] bg-muted text-muted-foreground">
          <Ellipsis className="size-3.5" />
        </span>
      ),
    },
  ];
  return (
    <div role="radiogroup" aria-labelledby="link-channel-label" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {tiles.map((tile) => (
        <label key={tile.value} className={TILE}>
          {/* Visually hidden native radios give arrow-key moves; the value posted is the hidden "channel". */}
          <input
            type="radio"
            name="channelTile"
            value={tile.value}
            checked={tile.checked}
            onChange={() => onChange(tile.value === "other" ? OTHER_CHANNELS[0]! : (tile.value as SocialPlatform))}
            className="sr-only"
          />
          {tile.icon}
          {tile.label}
        </label>
      ))}
    </div>
  );
}

function CreateLinkForm({
  programs,
  fixedMembershipId,
  defaultChannel,
  onCreated,
}: {
  programs: LinkProgramOption[];
  fixedMembershipId?: string;
  defaultChannel: SocialPlatform;
  onCreated: () => void;
}) {
  const [state, action] = useActionState(createReferralLink, idleFormState);
  const [membershipId, setMembershipId] = useState(fixedMembershipId ?? programs[0]?.membershipId ?? "");
  const [channel, setChannel] = useState<SocialPlatform>(defaultChannel);

  // The action refreshes the page itself; here the dialog only closes and confirms.
  useEffect(() => {
    if (state.status !== "success") return;
    toast.success(state.message);
    onCreated();
  }, [state, onCreated]);

  const program = programs.find((option) => option.membershipId === membershipId) ?? programs[0];
  const destinations = program?.availableDestinations ?? [];

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="channel" value={channel} />
      {fixedMembershipId ? <input type="hidden" name="membershipId" value={fixedMembershipId} /> : null}

      <FieldGroup className="gap-5">
        {state.status === "error" ? <FormMessage state={state} /> : null}

        {!fixedMembershipId && program ? (
          <Field data-invalid={invalid(state, "membershipId")}>
            <FieldLabel htmlFor="link-membership">Program</FieldLabel>
            <div className="relative">
              <AppLogo
                app={{ name: program.appName, logoUrl: program.logoUrl }}
                className="pointer-events-none absolute top-1/2 left-3 size-6 -translate-y-1/2 rounded-[7px] text-xs"
              />
              <select
                id="link-membership"
                name="membershipId"
                value={membershipId}
                onChange={(event) => setMembershipId(event.currentTarget.value)}
                aria-invalid={invalid(state, "membershipId")}
                className={cn(CONTROL, "pl-11 font-semibold")}
              >
                {programs.map((option) => (
                  <option key={option.membershipId} value={option.membershipId}>
                    {option.appName}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
            <FieldErrors state={state} field="membershipId" />
          </Field>
        ) : null}

        <Field data-invalid={invalid(state, "channel")}>
          <FieldLabel id="link-channel-label" asChild>
            <span>Where will you post it?</span>
          </FieldLabel>
          <ChannelTiles channel={channel} onChange={setChannel} />
          {isTileChannel(channel) ? null : (
            <div className="relative">
              <select
                aria-label="Other platform"
                value={channel}
                onChange={(event) => setChannel(event.currentTarget.value as SocialPlatform)}
                className={CONTROL}
              >
                {OTHER_CHANNELS.map((platform) => (
                  <option key={platform} value={platform}>
                    {SOCIAL_PLATFORM_LABELS[platform]}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
          )}
          <FieldErrors state={state} field="channel" />
        </Field>

        <Field data-invalid={invalid(state, "label")}>
          <FieldLabel htmlFor="link-label">Link name</FieldLabel>
          <Input
            id="link-label"
            name="label"
            required
            maxLength={80}
            placeholder="e.g. TikTok bio, Video 1"
            defaultValue={valueFor(state, "label")}
            aria-invalid={invalid(state, "label")}
            aria-describedby="link-label-hint"
            className="h-11 rounded-xl bg-background dark:bg-background"
          />
          <FieldDescription id="link-label-hint">Only you see this name.</FieldDescription>
          <FieldErrors state={state} field="label" />
        </Field>

        <Field data-invalid={invalid(state, "destinationKind")}>
          <FieldLabel htmlFor="link-destination">Opens</FieldLabel>
          {destinations.length > 0 ? (
            <div className="relative">
              <select
                // A new program brings its own destinations; start from its first.
                key={program?.membershipId}
                id="link-destination"
                name="destinationKind"
                defaultValue={valueFor(state, "destinationKind") ?? destinations[0]?.kind}
                aria-invalid={invalid(state, "destinationKind")}
                className={CONTROL}
              >
                {destinations.map((destination) => {
                  const host = hostOf(destination.url);
                  return (
                    <option key={destination.kind} value={destination.kind}>
                      {host ? `${destination.label} · ${host}` : destination.label}
                    </option>
                  );
                })}
              </select>
              <SelectChevron />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {program?.appName ?? "This app"} hasn’t added a page for links to open yet.
            </p>
          )}
          <FieldErrors state={state} field="destinationKind" />
        </Field>
      </FieldGroup>

      <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0 pt-1">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11 px-[18px]">
            Cancel
          </Button>
        </DialogClose>
        <SubmitButton className="h-11 px-5" pendingLabel="Creating link…" disabled={destinations.length === 0}>
          Create link
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}

/**
 * "Create link" in a dialog around any trigger. Posts the same fields as
 * the inline form (membershipId, label, channel, destinationKind); errors
 * stay in the dialog, success closes it with a toast.
 */
export function CreateLinkDialog({
  programs,
  fixedMembershipId,
  defaultChannel = "tiktok",
  children,
}: {
  programs: LinkProgramOption[];
  fixedMembershipId?: string;
  defaultChannel?: SocialPlatform;
  /** The trigger, e.g. a button. */
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto rounded-[20px] border bg-card p-5 ring-0 sm:max-w-[520px] sm:p-7">
        <DialogHeader className="gap-1.5 pr-8">
          <DialogTitle className="text-xl leading-tight font-extrabold tracking-[-0.02em]">Create link</DialogTitle>
          <DialogDescription>Make one for each place you post, so you can see which one works.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts from a clean form. */}
        <CreateLinkForm
          programs={programs}
          fixedMembershipId={fixedMembershipId}
          defaultChannel={defaultChannel}
          onCreated={close}
        />
      </DialogContent>
    </Dialog>
  );
}
