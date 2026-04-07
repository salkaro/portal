"use client";

import { useState, useEffect, useRef } from "react";
import { limitInput } from "@/utils/string";
import Link from "next/link";
import { Button } from "@salkaro/ui";
import { Input } from "@salkaro/ui";
import { Label } from "@salkaro/ui";
import { Alert, AlertDescription } from "@salkaro/ui";
import { Spinner } from "@salkaro/ui";
import { ClipboardListIcon } from "lucide-react";
import { Progress } from "@salkaro/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@salkaro/ui";
import { ROUTES } from "@/constants/routes";
import { joinWaitlist } from "@/services/waitlist";

type StepKey =
  | "email"
  | "agency_size"
  | "client_count"
  | "tools"
  | "update_method"
  | "referral"
  | "success";

const STEPS: StepKey[] = [
  "email",
  "agency_size",
  "client_count",
  "tools",
  "update_method",
  "referral",
];

const TOOLS_OPTIONS = [
  { value: "monday", label: "Monday.com" },
  { value: "linear", label: "Linear" },
  { value: "asana", label: "Asana" },
  { value: "trello", label: "Trello" },
  { value: "notion", label: "Notion" },
  { value: "clickup", label: "ClickUp" },
  { value: "jira", label: "Jira" },
  { value: "spreadsheets", label: "Spreadsheets" },
  { value: "other", label: "Other" },
];

export function WaitlistForm() {
  const [step, setStep] = useState<StepKey>("email");
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [email, setEmail] = useState("");
  const [agencySize, setAgencySize] = useState("");
  const [clientCount, setClientCount] = useState("");
  const [tools, setTools] = useState("");
  const [updateMethod, setUpdateMethod] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pendingStep = useRef<StepKey | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const progress =
    step === "success" ? 100 : (stepIndex / (STEPS.length - 1)) * 100;

  function advance(next: StepKey) {
    setError(null);
    setDirection("forward");
    pendingStep.current = next;
    setPhase("exit");
  }

  function goBack(next: StepKey) {
    setError(null);
    setDirection("back");
    pendingStep.current = next;
    setPhase("exit");
  }

  useEffect(() => {
    if (phase === "exit") {
      // After exit animation completes, swap step and start enter
      const timer = setTimeout(() => {
        if (pendingStep.current) {
          setStep(pendingStep.current);
          pendingStep.current = null;
        }
        setPhase("enter");
      }, 150);
      return () => clearTimeout(timer);
    }
    if (phase === "enter") {
      // After enter animation completes, go idle
      const timer = setTimeout(() => setPhase("idle"), 150);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { success, error: err } = await joinWaitlist({
      email,
      agencySize,
      clientCount,
      tools: tools ? [tools] : [],
      updateMethod,
      referralSource,
    });

    if (!success) {
      setError(err);
      setIsLoading(false);
      return;
    }

    advance("success");
    setIsLoading(false);
  }

  // exit: slide out in the direction of travel; enter: slide in from opposite side
  const exitClass =
    phase === "exit"
      ? direction === "forward"
        ? "opacity-0 -translate-x-4"
        : "opacity-0 translate-x-4"
      : phase === "enter"
      ? direction === "forward"
        ? "opacity-0 translate-x-4"
        : "opacity-0 -translate-x-4"
      : "opacity-100 translate-x-0";

  const transitionClass = "transition-all duration-150 ease-in-out";

  if (step === "success") {
    return (
      <div className={`w-full space-y-8 ${transitionClass} ${exitClass}`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClipboardListIcon className="size-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">You&apos;re on the list</h1>
            <p className="text-sm text-muted-foreground">
              We&apos;ll be in touch when your access is ready.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Already have access?{" "}
            <Link
              href={ROUTES.LOGIN}
              className="underline underline-offset-3 hover:text-foreground"
            >
              Sign in
            </Link>
          </p>
        </div>
        <Progress value={100} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 overflow-hidden">
      <div className={`${transitionClass} ${exitClass}`}>
        {step === "email" && (
          <form
            onSubmit={(e) => { e.preventDefault(); advance("agency_size"); }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">Get early access</h1>
              <p className="text-xs text-muted-foreground">
                Already have access?{" "}
                <Link
                  href={ROUTES.LOGIN}
                  className="underline underline-offset-3 hover:text-foreground"
                >
                  Sign in
                </Link>
              </p>
            </div>
            <div className="space-y-1 px-1">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(limitInput(e.target.value, 254))}
              />
            </div>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        )}

        {step === "agency_size" && (
          <form
            onSubmit={(e) => { e.preventDefault(); advance("client_count"); }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">How big is your agency?</h1>
              <p className="text-xs text-muted-foreground">Including yourself.</p>
            </div>
            <div className="space-y-1">
              <Label>Agency size</Label>
              <Select value={agencySize} onValueChange={setAgencySize} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo (just me)</SelectItem>
                  <SelectItem value="2-5">2–5 people</SelectItem>
                  <SelectItem value="6-20">6–20 people</SelectItem>
                  <SelectItem value="21+">21+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => goBack("email")}>Back</Button>
              <Button type="submit" disabled={!agencySize}>Continue</Button>
            </div>
          </form>
        )}

        {step === "client_count" && (
          <form
            onSubmit={(e) => { e.preventDefault(); advance("tools"); }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">How many active clients do you have?</h1>
            </div>
            <div className="space-y-1">
              <Label>Number of clients</Label>
              <Select value={clientCount} onValueChange={setClientCount} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-5">1–5</SelectItem>
                  <SelectItem value="6-15">6–15</SelectItem>
                  <SelectItem value="16-30">16–30</SelectItem>
                  <SelectItem value="30+">30+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => goBack("agency_size")}>Back</Button>
              <Button type="submit" disabled={!clientCount}>Continue</Button>
            </div>
          </form>
        )}

        {step === "tools" && (
          <form
            onSubmit={(e) => { e.preventDefault(); advance("update_method"); }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">What tool do you mainly use for tasks?</h1>
            </div>
            <div className="space-y-1">
              <Label>Project management tool</Label>
              <Select value={tools} onValueChange={setTools} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a tool" />
                </SelectTrigger>
                <SelectContent>
                  {TOOLS_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => goBack("client_count")}>Back</Button>
              <Button type="submit" disabled={!tools}>Continue</Button>
            </div>
          </form>
        )}

        {step === "update_method" && (
          <form
            onSubmit={(e) => { e.preventDefault(); advance("referral"); }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">How do you share updates with clients today?</h1>
            </div>
            <div className="space-y-1">
              <Label>Current method</Label>
              <Select value={updateMethod} onValueChange={setUpdateMethod} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="slack-teams">Slack or Teams</SelectItem>
                  <SelectItem value="portal">A client portal tool</SelectItem>
                  <SelectItem value="nothing">Nothing formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => goBack("tools")}>Back</Button>
              <Button type="submit" disabled={!updateMethod}>Continue</Button>
            </div>
          </form>
        )}

        {step === "referral" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">How did you hear about us?</h1>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <Label>Source</Label>
              <Select value={referralSource} onValueChange={setReferralSource} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="search">Search engine</SelectItem>
                  <SelectItem value="social">Social media</SelectItem>
                  <SelectItem value="friend">Friend or colleague</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" disabled={isLoading} onClick={() => goBack("update_method")}>
                Back
              </Button>
              <Button type="submit" disabled={isLoading || !referralSource}>
                {isLoading ? <Spinner /> : null}
                Join waitlist
              </Button>
            </div>
          </form>
        )}
      </div>

      <Progress value={progress} />
    </div>
  );
}
