"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2, Mail, ShieldOffIcon } from "lucide-react";
import type { PortalAccessType } from "@/types/portal";
import {
  fetchPublicPortal,
  findPortalByCode,
  findPortalsByEmail,
  requestPortalOtp,
  verifyPortalCode,
  verifyPortalOtp,
} from "@/services/portals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { PortalBoardView } from "@/components/app/portals/view/portal-board-view";
import { Spinner } from "@/components/ui/spinner";
import GridDots from "@/components/animations/grid-dots";

type PublicPortalViewProps = {
  portalId: string;
  preAuthCode?: string;
};

type PortalPayload = {
  id: string;
  name: string;
  import_config: {
    boardId: string;
    boardName: string;
    selectedColumnIds: string[];
  } | null;
  customization: {
    tagline: string | null;
    showStatusSection: boolean;
    showTimelineSection: boolean;
    showOwnersSection: boolean;
    projectOwner: string | null;
    organisationName: string | null;
  } | null;
  access_type: PortalAccessType;
  hasInstantAccess: boolean;
};

type PortalSummary = {
  id: string;
  name: string;
  access_type: PortalAccessType;
};

// ------------------------------------------------------------------
// No-portal-id entry screen
// ------------------------------------------------------------------

type EntryMode = "choose" | "email" | "code";

function PortalEntryScreen({ preAuthCode }: { preAuthCode?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<EntryMode>("choose");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Email path state
  const [email, setEmail] = useState("");
  const [matchedPortals, setMatchedPortals] = useState<PortalSummary[] | null>(
    null,
  );
  const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Code path state
  const [code, setCode] = useState(preAuthCode ?? "");

  useEffect(() => {
    if (preAuthCode) {
      void handleVerifyCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    setMode("choose");
    setErrorMessage(null);
    setEmail("");
    setMatchedPortals(null);
    setSelectedPortalId(null);
    setOtp("");
    setOtpSent(false);
    setDevOtp(null);
    setCode("");
  }

  // --- Email path ---

  async function handleFindByEmail() {
    setErrorMessage(null);
    setLoading(true);
    try {
      const { portals } = await findPortalsByEmail(email);
      setMatchedPortals(portals);
      if (portals.length === 1) {
        setSelectedPortalId(portals[0].id);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No portals found for this email",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    if (!selectedPortalId) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      const payload = await requestPortalOtp({
        portalId: selectedPortalId,
        email,
      });
      setOtpSent(true);
      setDevOtp(payload.devOtp ?? null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send OTP",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!selectedPortalId) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      await verifyPortalOtp({ portalId: selectedPortalId, email, otp });
      router.push(`${ROUTES.VIEW}?portal_id=${selectedPortalId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  // --- Code path ---

  async function handleVerifyCode() {
    setErrorMessage(null);
    setLoading(true);
    try {
      const { portal } = await findPortalByCode(code);
      router.push(
        `${ROUTES.VIEW}?portal_id=${portal.id}&code=${encodeURIComponent(code)}`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Invalid access code",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <GridDots className="min-h-screen">
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access a shared portal</CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "choose"
              ? "How would you like to access your portal?"
              : mode === "email"
                ? "Enter your email to receive a one-time passcode"
                : "Enter the access code provided by the portal owner"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "choose" && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => setMode("email")}
              >
                <Mail className="size-5" />
                <span>Email OTP</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => setMode("code")}
              >
                <KeyRound className="size-5" />
                <span>Access code</span>
              </Button>
            </div>
          )}

          {mode === "email" && (
            <div className="space-y-3">
              {!matchedPortals ? (
                <>
                  <div className="space-y-1">
                    <label className="font-medium">Email address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="you@company.com"
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={loading || email.trim().length === 0}
                    onClick={handleFindByEmail}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 size-4" />
                    )}
                    Continue
                  </Button>
                </>
              ) : matchedPortals.length > 1 && !selectedPortalId ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Multiple portals found. Select one to continue.
                  </p>
                  <div className="space-y-2">
                    {matchedPortals.map((p) => (
                      <Button
                        key={p.id}
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setSelectedPortalId(p.id)}
                      >
                        {p.name}
                      </Button>
                    ))}
                  </div>
                </>
              ) : !otpSent ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Send a one-time passcode to{" "}
                    <span className="font-medium">{email}</span>
                  </p>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={loading}
                    onClick={handleSendOtp}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 size-4" />
                    )}
                    Send OTP
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      One-time passcode
                    </label>
                    <Input
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="6-digit code"
                    />
                    {devOtp ? (
                      <p className="text-xs text-muted-foreground">
                        Dev OTP: <span className="font-mono">{devOtp}</span>
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={loading || otp.trim().length === 0}
                    onClick={handleVerifyOtp}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 size-4" />
                    )}
                    Verify OTP
                  </Button>
                </>
              )}
            </div>
          )}

          {mode === "code" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-medium">Access code</label>
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Enter your access code"
                />
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={loading || code.trim().length === 0}
                onClick={handleVerifyCode}
              >
                {loading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 size-4" />
                )}
                Access portal
              </Button>
            </div>
          )}

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          {mode !== "choose" && (
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Go back
            </button>
          )}
        </CardContent>
      </Card>
    </main>
    </GridDots>
  );
}

// ------------------------------------------------------------------
// Portal view (with portal_id)
// ------------------------------------------------------------------

export function PublicPortalView({
  portalId,
  preAuthCode,
}: PublicPortalViewProps) {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [portal, setPortal] = useState<PortalPayload | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadPortal = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        if (preAuthCode) {
          const payload = await verifyPortalCode({
            portalId,
            code: preAuthCode,
          });
          if (cancelled) return;
          setPortal(payload);
          setIsAuthorized(true);
        } else {
          const payload = await fetchPublicPortal(portalId);
          if (cancelled) return;
          setPortal(payload);
          setIsAuthorized(payload.hasInstantAccess);
        }
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load portal",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPortal();
    return () => {
      cancelled = true;
    };
  }, [portalId, preAuthCode]);

  useEffect(() => {
    if (portal?.name) {
      document.title = portal.name;
      return () => {
        document.title = "Portal";
      };
    }
  }, [portal?.name]);

  const accessLabel = useMemo(() => {
    if (!portal) return "";
    if (portal.access_type === "anyone_with_link") return "Anyone with link";
    if (portal.access_type === "email_otp") return "Email verification";
    return "Access code";
  }, [portal]);

  const handleSendOtp = async () => {
    if (!portal) return;
    setVerifying(true);
    setErrorMessage(null);
    try {
      const payload = await requestPortalOtp({ portalId: portal.id, email });
      setOtpSent(true);
      setDevOtp(payload.devOtp ?? null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send OTP",
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!portal) return;
    setVerifying(true);
    setErrorMessage(null);
    try {
      const payload = await verifyPortalOtp({
        portalId: portal.id,
        email,
        otp,
      });
      setPortal(payload);
      setIsAuthorized(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!portal) return;
    setVerifying(true);
    setErrorMessage(null);
    try {
      const payload = await verifyPortalCode({
        portalId: portal.id,
        code: accessCode,
      });
      setPortal(payload);
      setIsAuthorized(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Invalid access code",
      );
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <GridDots className="min-h-screen">
        <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Finding portal...
        </div>
      </GridDots>
    );
  }

  if (!portal) {
    return (
      <GridDots className="min-h-screen">
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
            <ShieldOffIcon className="size-6" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">Unable to open portal</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {errorMessage ?? "This portal may not exist or is not accessible."}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={ROUTES.VIEW}>Try a different code</a>
          </Button>
        </div>
      </main>
      </GridDots>
    );
  }

  if (!isAuthorized) {
    return (
      <GridDots className="min-h-screen">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>{portal.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Access required: {accessLabel}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {portal.access_type === "email_otp" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={verifying || email.trim().length === 0}
                  className="w-full"
                >
                  {verifying ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 size-4" />
                  )}
                  Send OTP
                </Button>

                {otpSent ? (
                  <div className="space-y-3 rounded-md border p-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">
                        One-time passcode
                      </label>
                      <Input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="6-digit code"
                      />
                      {devOtp ? (
                        <p className="text-xs text-muted-foreground">
                          Dev OTP: <span className="font-mono">{devOtp}</span>
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifying || otp.trim().length === 0}
                      className="w-full"
                    >
                      {verifying ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 size-4" />
                      )}
                      Verify OTP
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {portal.access_type === "anyone_with_code" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Access code</label>
                  <Input
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Enter code"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifying || accessCode.trim().length === 0}
                  className="w-full"
                >
                  {verifying ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 size-4" />
                  )}
                  Verify code
                </Button>
              </div>
            ) : null}

            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}
          </CardContent>
        </Card>
      </main>
      </GridDots>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <PortalBoardView
        portalId={portal.id}
        portalName={portal.name}
        customization={portal.customization ?? null}
      />
    </div>
  );
}

export { PortalEntryScreen };
