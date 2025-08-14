import { useState } from 'react'
import { TauriClient } from '../lib/tauriClient'

interface FileUploadOptions {
  maxSize?: number // en bytes, par défaut 10MB
  allowedTypes?: string[] // MIME types autorisés
}

interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
  url: string | null
}

interface FileWithPreview extends File {
  preview?: string
}

export function useFileUpload(options: FileUploadOptions = {}) {
  const { 
    maxSize = 10 * 1024 * 1024, // 10MB par défaut
    allowedTypes = ['image/*', 'application/pdf', 'text/*'] 
  } = options

  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    url: null
  })

  const validateFile = (file: File): string | null => {
    // Vérifier la taille
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return `Le fichier est trop volumineux (max ${maxSizeMB}MB)`
    }

    // Vérifier le type MIME
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.slice(0, -2)
        return file.type.startsWith(baseType)
      }
      return file.type === type
    })

    if (!isAllowed) {
      return `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
    }

    return null
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    // Valider le fichier
    const validationError = validateFile(file)
    if (validationError) {
      setUploadState(prev => ({ ...prev, error: validationError }))
      return null
    }

    try {
      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
        url: null
      })

      // Convertir le fichier en tableau de bytes
      const arrayBuffer = await file.arrayBuffer()
      const bytes = Array.from(new Uint8Array(arrayBuffer))

      // Progress simulation (MinIO upload est rapide en local)
      setUploadState(prev => ({ ...prev, progress: 50 }))

      // Upload via Tauri command
      const url = await TauriClient.uploadJustificatif(bytes, file.name, file.type || undefined)

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        url
      })

      return url
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload'
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        url: null
      })
      return null
    }
  }

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      url: null
    })
  }

  return {
    uploadState,
    uploadFile,
    validateFile,
    resetUpload
  }
}

export type { FileWithPreview, UploadState }