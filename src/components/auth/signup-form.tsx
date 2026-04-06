'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { limitInput } from '@/utils/string'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { signUpWithEmail, signInWithGoogle } from '@/services/auth'
import { checkWaitlistAccess } from '@/services/waitlist'
import { logger } from '@/lib/logger'
import { ROUTES } from '@/constants/routes'
import { ShieldOffIcon } from 'lucide-react'

type ActiveAction = 'email' | 'google' | null

const MIN_PASSWORD_LENGTH = 8

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
  if (!/[^a-zA-Z0-9]/.test(password)) return 'Password must contain at least one symbol'
  return null
}

export function SignupForm() {
  const searchParams = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(
    () => searchParams.get('error') === 'no_access'
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeAction, setActiveAction] = useState<ActiveAction>(null)

  const isLoading = activeAction !== null

  async function handleEmailSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPasswordError(null)
    setActiveAction('email')

    const passwordValidationError = validatePassword(password)
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      setActiveAction(null)
      return
    }

    // Signup gate — check waitlist before anything else
    const { success: hasAccess } = await checkWaitlistAccess(email)

    if (!hasAccess) {
      setAccessDenied(true)
      setActiveAction(null)
      return
    }


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
      <div className="w-full space-y-4">
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
    )
  }

  if (accessDenied) {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldOffIcon className="size-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Early access only</h1>
            <p className="text-sm text-muted-foreground">
              Salkaro Portal is currently invite-only. Join the waitlist and
              we&apos;ll let you know when you&apos;re in.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href={ROUTES.WAITLIST}>Join the waitlist</Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setAccessDenied(false)}
          >
            Try a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 max-w-sm px-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Early access sign up</h1>
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
  )
}
