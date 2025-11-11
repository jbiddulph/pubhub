import 'react-native-url-polyfill/auto'

import { Buffer } from 'buffer'
import * as FileSystem from 'expo-file-system'

import { supabase } from './supabase'

function normalizeDogPhotoPath(path: string) {
  return path.replace(/^\/+/, '')
}

function generateDogPhotoPath(userId: string, extension: string) {
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const uniqueSegment = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `dogs/${userId}/${uniqueSegment}.${safeExtension}`
}

function guessContentType(extension?: string | null) {
  const ext = extension?.toLowerCase()

  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'jpe':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'heic':
      return 'image/heic'
    case 'heif':
      return 'image/heif'
    case 'webp':
      return 'image/webp'
    default:
      return 'image/jpeg'
  }
}

export async function uploadDogPhoto(
  userId: string,
  localUri: string,
  options?: { previousPath?: string | null },
) {
  try {
    const extensionMatch = localUri.split('.').pop()
    const extension = extensionMatch?.split('?')[0]
    const contentType = guessContentType(extension)
    let blob: Blob | null = null

    if (localUri.startsWith('data:')) {
      const response = await fetch(localUri)
      blob = await response.blob()
    } else {
      try {
        const response = await fetch(localUri)
        if (response.ok) {
          blob = await response.blob()
        }
      } catch {
        // swallow and attempt fallback
      }

      if (!blob) {
        const fileInfo = await FileSystem.getInfoAsync(localUri)

        if (!fileInfo.exists) {
          throw new Error('Selected photo could not be accessed on this device.')
        }

        const base64 = await FileSystem.readAsStringAsync(localUri, {
          encoding: 'base64',
        })

        const byteArray = Buffer.from(base64, 'base64')
        blob = new Blob([byteArray], { type: contentType })
      }
    }

    if (!blob) {
      throw new Error('Unable to prepare photo for upload.')
    }

    const inferredExtension = blob.type?.split('/')[1]
    const storageExtension = inferredExtension ?? extension ?? 'jpg'
    const storagePath = generateDogPhotoPath(userId, storageExtension)

    const { error: uploadError } = await supabase.storage
      .from('doghealthy')
      .upload(storagePath, blob, {
        upsert: false,
        cacheControl: '3600',
        contentType: blob.type || contentType,
      })

    if (uploadError) {
      return { error: uploadError }
    }

    const previousPath = options?.previousPath
    if (previousPath) {
      await supabase.storage.from('doghealthy').remove([normalizeDogPhotoPath(previousPath)])
    }

    return { data: { path: storagePath } }
  } catch (error) {
    return { error }
  }
}

export async function deleteDogPhoto(path?: string | null) {
  if (!path) return
  await supabase.storage.from('doghealthy').remove([normalizeDogPhotoPath(path)])
}

export function getPublicDogPhotoUrl(photoPath?: string | null) {
  if (!photoPath) {
    return null
  }

  if (/^https?:\/\//i.test(photoPath)) {
    return photoPath
  }

  const normalizedPath = normalizeDogPhotoPath(photoPath)
  const { data } = supabase.storage.from('doghealthy').getPublicUrl(normalizedPath)

  return data?.publicUrl ?? null
}

