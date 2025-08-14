/**
 * Client MinIO pour gestion des fichiers justificatifs
 * Upload local avec stockage des fichiers PDF/images
 */

// Configuration MinIO (à adapter selon environnement)
const MINIO_CONFIG = {
  endpoint: 'localhost',
  port: 9000,
  useSSL: false,
  bucketName: 'jla-documents'
}

/**
 * Upload un fichier vers MinIO et retourne l'URL d'accès
 */
export const uploadToMinIO = async (file: File): Promise<string> => {
  try {
    console.log('🔄 Début upload MinIO:', file.name)
    
    // Lire le fichier en tant qu'array buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileContent = Array.from(new Uint8Array(arrayBuffer))
    
    // Appeler la commande Tauri pour upload
    const { invoke } = await import('@tauri-apps/api/core')
    const url = await invoke<string>('cmd_upload_justificatif', {
      fileContent,
      originalFilename: file.name,
      contentType: file.type || undefined
    })
    
    console.log('✅ Upload MinIO réussi:', url)
    return url
    
  } catch (error) {
    console.error('❌ Erreur upload MinIO:', error)
    throw new Error(`Échec de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}

/**
 * Valide le type et la taille du fichier avant upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Types autorisés
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png']
  
  // Vérifier le type MIME
  const typeValid = allowedTypes.includes(file.type)
  
  // Vérifier l'extension (fallback)
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  const extensionValid = allowedExtensions.includes(extension)
  
  if (!typeValid && !extensionValid) {
    return {
      valid: false,
      error: 'Type de fichier non supporté. Utilisez PDF, JPG ou PNG.'
    }
  }
  
  // Vérifier la taille (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)}MB). Maximum 10MB.`
    }
  }
  
  return { valid: true }
}

/**
 * Supprime un fichier de MinIO
 */
export const deleteFromMinIO = async (url: string): Promise<void> => {
  try {
    console.log('🗑️ Suppression MinIO:', url)
    
    // Appeler la commande Tauri pour suppression
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('cmd_delete_justificatif', { fileUrl: url })
    
    console.log('✅ Suppression MinIO réussie')
    
  } catch (error) {
    console.error('❌ Erreur suppression MinIO:', error)
    throw new Error(`Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}