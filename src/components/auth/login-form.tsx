'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { signInWithEmail, signInWithGoogle } from '@/services/auth'
import { logger } from '@/lib/logger'
import { ROUTES } from '@/constants/routes'

type ActiveAction = 'email' | 'google' | null

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<ActiveAction>(null)

  const isLoading = activeAction !== null

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setActiveAction('email')

    const { data, error } = await signInWithEmail(email, password)

    if (error) {
      logger.warn('auth.signin.failed', { reason: error.message })
      setError(error.message)
      setActiveAction(null)
      return
    }

    logger.info('auth.signin.success', { userId: data?.user?.id })
    router.push(ROUTES.DASHBOARD)
  }

  async function handleGoogleSignIn() {
    setError(null)
    setActiveAction('google')

    const { error } = await signInWithGoogle()

    if (error) {
      logger.warn('auth.signin.google.failed', { reason: error.message })
      setError(error.message)
      setActiveAction(null)
    }
    // On success the browser is redirected by Supabase OAuth — no push needed
  }


  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Sign in to Portal</h1>
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={ROUTES.GET_STARTED}
              className="underline underline-offset-3 hover:text-foreground"
            >
              Get started
            </Link>
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {activeAction === "email" ? <Spinner /> : null}
            Sign in
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
        >
          {activeAction === "google" ? <Spinner /> : null}
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
