'use client'

import { useState } from 'react'
import { limitInput } from '@/utils/string'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { signUpWithEmail, signInWithGoogle } from '@/services/auth'
import { logger } from '@/lib/logger'
import { ROUTES } from '@/constants/routes'

type ActiveAction = 'email' | 'google' | null

const MIN_PASSWORD_LENGTH = 8

export function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeAction, setActiveAction] = useState<ActiveAction>(null)

  const isLoading = activeAction !== null

  async function handleEmailSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPasswordError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }

    setActiveAction('email')

    const { data, error } = await signUpWithEmail(email, password, fullName)

    if (error) {
      logger.warn('auth.signup.failed', { reason: error.message })
      setError(error.message)
      setActiveAction(null)
      return
    }

    logger.info('auth.signup.success', { userId: data?.user?.id })
    setSuccess(true)
    setActiveAction(null)
  }

  async function handleGoogleSignIn() {
    setError(null)
    setActiveAction('google')

    const { error } = await signInWithGoogle()

    if (error) {
      logger.warn('auth.signup.google.failed', { reason: error.message })
      setError(error.message)
      setActiveAction(null)
    }
    // On success the browser is redirected by Supabase OAuth — no push needed
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4">
          <Alert>
            <AlertDescription>
              Check your email to confirm your account. You can close this tab.
            </AlertDescription>
          </Alert>
          <p className="text-xs text-muted-foreground text-center">
            Already confirmed?{' '}
            <Link href={ROUTES.LOGIN} className="underline underline-offset-3 hover:text-foreground">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }



  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Create your account</h1>
          <p className="text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href={ROUTES.LOGIN} className="underline underline-offset-3 hover:text-foreground">
              Sign in
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
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              type="text"
              autoComplete="name"
              required
              disabled={isLoading}
              value={fullName}
              onChange={(e) => setFullName(limitInput(e.target.value, 64))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(limitInput(e.target.value, 254))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              disabled={isLoading}
              aria-invalid={passwordError !== null}
              value={password}
              onChange={(e) => {
                setPassword(limitInput(e.target.value, 128))
                if (passwordError) setPasswordError(null)
              }}
            />
            {passwordError && (
              <p className="text-xs text-destructive">{passwordError}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {activeAction === 'email' ? <Spinner /> : null}
            Create account
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
          {activeAction === 'google' ? (
            <Spinner />
          ) : (
            <>
              <Image
                src="/auth/light/google.svg"
                alt="Google"
                width={16}
                height={16}
                className="dark:hidden"
              />
              <Image
                src="/auth/dark/google.svg"
                alt="Google"
                width={16}
                height={16}
                className="hidden dark:block"
              />
            </>
          )}
          Continue with Google
        </Button>
      </div>
    </div>
  )
}
