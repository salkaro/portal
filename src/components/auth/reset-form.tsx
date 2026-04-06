'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { limitInput } from '@/utils/string'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { requestPasswordReset, updatePassword } from '@/services/auth'
import { logger } from '@/lib/logger'
import { ROUTES } from '@/constants/routes'

const MIN_PASSWORD_LENGTH = 8

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
  if (!/[^a-zA-Z0-9]/.test(password)) return 'Password must contain at least one symbol'
  return null
}

export function ResetForm({ linkError, isUpdateMode }: { linkError: string | null; isUpdateMode: boolean }) {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleRequestReset(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error } = await requestPasswordReset(email)

    if (error) {
      logger.warn('auth.reset.request.failed', { reason: error.message })
      setError(error.message)
      setIsLoading(false)
      return
    }

    logger.info('auth.reset.request.sent')
    setSent(true)
    setIsLoading(false)
  }

  async function handleUpdatePassword(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPasswordError(null)

    const validationError = validatePassword(password)
    if (validationError) {
      setPasswordError(validationError)
      return
    }

    setIsLoading(true)

    const { error } = await updatePassword(password)

    if (error) {
      logger.warn('auth.reset.update.failed', { reason: error.message })
      setError(error.message)
      setIsLoading(false)
      return
    }

    logger.info('auth.reset.update.success')
    router.push(ROUTES.DASHBOARD)
  }

  if (linkError) {
    return (
      <div className="w-full space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Link expired</h1>
          <p className="text-sm text-muted-foreground">
            This reset link is invalid or has expired. Request a new one below.
          </p>
        </div>
        <form onSubmit={handleRequestReset} className="space-y-3">
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner /> : null}
            Send new reset link
          </Button>
        </form>
        <p className="text-xs text-center text-muted-foreground">
          <Link href={ROUTES.LOGIN} className="underline underline-offset-3 hover:text-foreground">
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="w-full space-y-4">
        <Alert>
          <AlertDescription>
            Check your email for a reset link. You can close this tab.
          </AlertDescription>
        </Alert>
        <p className="text-xs text-center text-muted-foreground">
          <Link href={ROUTES.LOGIN} className="underline underline-offset-3 hover:text-foreground">
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  if (isUpdateMode) {
    return (
      <div className="w-full space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Set a new password</h1>
          <p className="text-xs text-muted-foreground">Must be at least 8 characters with uppercase, lowercase, number, and symbol.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="password">New password</Label>
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
            {isLoading ? <Spinner /> : null}
            Update password
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Reset your password</h1>
        <p className="text-xs text-muted-foreground">
          Remember it?{' '}
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

      <form onSubmit={handleRequestReset} className="space-y-3">
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Spinner /> : null}
          Send reset link
        </Button>
      </form>
    </div>
  )
}
