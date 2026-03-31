import { createClient } from '@/lib/supabase/client'

const AVATAR_BUCKET = 'avatars'
const ORGANISATION_BRANDING_BUCKET = 'organisation-branding'

function dataUrlToBlob(dataUrl: string): Blob {
    const [meta, base64] = dataUrl.split(',')
    const mimeMatch = meta.match(/data:(.*?);base64/)
    const mimeType = mimeMatch?.[1] ?? 'image/jpeg'

    const binaryString = atob(base64 ?? '')
    const bytes = new Uint8Array(binaryString.length)

    for (let i = 0; i < binaryString.length; i += 1) {
        bytes[i] = binaryString.charCodeAt(i)
    }

    return new Blob([bytes], { type: mimeType })
}

export async function uploadAvatarDataUrl(
    userId: string,
    avatarDataUrl: string
): Promise<{ publicUrl: string }> {
    const supabase = createClient()
    const filePath = `${userId}/profile.jpg`
    const blob = dataUrlToBlob(avatarDataUrl)

    const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, blob, {
            upsert: true,
            contentType: 'image/jpeg',
            cacheControl: '3600',
        })

    if (uploadError) {
        throw new Error(uploadError.message)
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)

    return { publicUrl: data.publicUrl }
}

export async function uploadOrganisationIconDataUrl(
    organisationId: string,
    iconDataUrl: string
): Promise<{ publicUrl: string }> {
    const supabase = createClient()
    const filePath = `${organisationId}/icon.jpg`
    const blob = dataUrlToBlob(iconDataUrl)

    const { error: uploadError } = await supabase.storage
        .from(ORGANISATION_BRANDING_BUCKET)
        .upload(filePath, blob, {
            upsert: true,
            contentType: 'image/jpeg',
            cacheControl: '3600',
        })

    if (uploadError) {
        throw new Error(uploadError.message)
    }

    const { data } = supabase.storage
        .from(ORGANISATION_BRANDING_BUCKET)
        .getPublicUrl(filePath)

    return { publicUrl: data.publicUrl }
}
