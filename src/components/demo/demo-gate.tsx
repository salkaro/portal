"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import GridDots from "@/components/animations/grid-dots";
import { DemoBoardView } from "@/components/demo/demo-board-view";
import { DEMO_ACCESS_CODE, DEMO_PORTAL_NAME } from "@/constants/demo-data";

const DEMO_HINT = `Try: ${DEMO_ACCESS_CODE}`;

export function DemoGate() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate a brief check delay
    setTimeout(() => {
      if (code.trim().toUpperCase() === DEMO_ACCESS_CODE) {
        setUnlocked(true);
      } else {
        setError(`Invalid access code. ${DEMO_HINT}`);
      }
      setLoading(false);
    }, 600);
  }

  if (unlocked) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl p-6">
        <DemoBoardView />
      </main>
    );
  }

  return (
    <GridDots className="min-h-screen">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{DEMO_PORTAL_NAME}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter the demo access code to preview a sample client portal.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="font-medium">Access code</label>
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter access code"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">{DEMO_HINT}</p>
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || code.trim().length === 0}
              >
                {loading ? (
                  <Spinner />
                ) : (
                  <KeyRound className="size-4" />
                )}
                View demo portal
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </GridDots>
  );
}
