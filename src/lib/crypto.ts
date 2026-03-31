import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getEncryptionKey(): Buffer {
    const secret = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY

    if (!secret) {
        throw new Error('INTEGRATION_TOKEN_ENCRYPTION_KEY is required')
    }

    return createHash('sha256').update(secret).digest()
}

export function encryptText(plainText: string): string {
    const key = getEncryptionKey()
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, key, iv)

    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptText(encryptedValue: string): string {
    const [ivBase64, authTagBase64, payloadBase64] = encryptedValue.split(':')

    if (!ivBase64 || !authTagBase64 || !payloadBase64) {
        throw new Error('Invalid encrypted payload format')
    }

    const key = getEncryptionKey()
    const iv = Buffer.from(ivBase64, 'base64')
    const authTag = Buffer.from(authTagBase64, 'base64')
    const payload = Buffer.from(payloadBase64, 'base64')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(payload), decipher.final()])
    return decrypted.toString('utf8')
}
