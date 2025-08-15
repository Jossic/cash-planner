import { invoke } from '@tauri-apps/api/core'

/**
 * Ouvre un fichier ou une URL en utilisant l'application par défaut du système
 * Utilise le plugin tauri-plugin-opener recommandé
 */
export async function openFileUrl(url: string): Promise<void> {
  try {
    console.log('🔗 Tentative d\'ouverture de l\'URL:', url)
    
    // Validation de l'URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL invalide')
    }
    
    // Vérifier le format de l'URL
    const isHttpUrl = url.startsWith('http://') || url.startsWith('https://')
    const isFileUrl = url.startsWith('file://')
    
    if (!isHttpUrl && !isFileUrl) {
      throw new Error('URL doit commencer par http://, https:// ou file://')
    }
    
    // Utiliser la commande Tauri qui utilise maintenant tauri-plugin-opener
    await invoke('cmd_open_url', { url })
    
    console.log('✅ URL ouverte avec succès:', url)
  } catch (error) {
    console.error('❌ Erreur lors de l\'ouverture:', error)
    throw error
  }
}

/**
 * Teste l'ouverture d'une URL avec fallback vers le navigateur
 */
export async function openFileUrlWithFallback(url: string): Promise<void> {
  try {
    await openFileUrl(url)
  } catch (error) {
    console.warn('⚠️ Tauri opener a échoué, tentative de fallback:', error)
    
    // Fallback : ouvrir dans le navigateur (si c'est une URL HTTP)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        window.open(url, '_blank')
        console.log('✅ URL ouverte en fallback dans le navigateur')
      } catch (fallbackError) {
        console.error('❌ Fallback a également échoué:', fallbackError)
        throw new Error(`Impossible d'ouvrir l'URL: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    } else {
      throw error
    }
  }
}

/**
 * Valide qu'une URL MinIO est bien formée
 */
export function validateMinioUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return (
      (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') &&
      urlObj.hostname.includes('minio') &&
      urlObj.pathname.includes('.pdf')
    )
  } catch {
    return false
  }
}

/**
 * Ouvre un justificatif PDF depuis MinIO
 */
export async function openMinioJustificatif(url: string): Promise<void> {
  if (!validateMinioUrl(url)) {
    throw new Error('URL MinIO invalide')
  }
  
  return openFileUrlWithFallback(url)
}