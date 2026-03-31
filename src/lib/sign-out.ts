import { logger } from '@/lib/logger'
import { signOut } from '@/services/auth'

export async function handleSignOut(userId?: string) {
    await signOut()
    logger.info('auth.signout.success', { userId })
}
