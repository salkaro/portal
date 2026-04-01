import { logger } from '@/lib/logger'
import { signOut } from '@/services/auth'
import { ROUTES } from '@/constants/routes'

export async function handleSignOut(userId?: string) {
    await signOut()
    logger.info('auth.signout.success', { userId })
    window.location.href = ROUTES.LOGIN
}
