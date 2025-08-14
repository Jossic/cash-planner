/**
 * Formulaire compact moderne pour saisie rapide d'opérations
 * Design professional avec espacement élégant sur 2-3 lignes
 */

import React, { useState, useRef, useEffect } from 'react'
import { Plus, Upload, FileText, Calculator, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadToMinIO, validateFile } from '../../lib/minioClient'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import { invoke } from '@tauri-apps/api/core'

interface CompactOperationFormProps {
  onOperationAdded?: () => void
}

interface Operation {
  id: string
  date_facture: string
  date_encaissement: string | null
  date_paiement: string | null
  sens: 'vente' | 'achat'
  montant_ht_cents: number
  montant_tva_cents: number
  montant_ttc_cents: number
  tva_sur_encaissements: boolean
  libelle: string | null
  justificatif_url: string | null
  created_at: string
  updated_at: string
}

export const CompactOperationForm: React.FC<CompactOperationFormProps> = ({ 
  onOperationAdded 
}) => {
  const [sens, setSens] = useState<'vente' | 'achat'>('vente')
  const [isPrestation, setIsPrestation] = useState(true)
  const [dateFacture, setDateFacture] = useState('')
  const [dateEncaissement, setDateEncaissement] = useState('')
  const [datePaiement, setDatePaiement] = useState('')
  const [montantHt, setMontantHt] = useState('')
  const [montantTva, setMontantTva] = useState('')
  const [libelle, setLibelle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)
  
  const firstInputRef = useRef<HTMLSelectElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Calcul automatique
  const montantHtNum = parseFloat(montantHt) || 0
  const montantTvaNum = parseFloat(montantTva) || 0
  const montantTtc = sens === 'achat' 
    ? montantHtNum + montantTvaNum
    : montantHtNum * 1.2 // TOUJOURS 20% TVA pour les ventes

  // Validation du bouton
  const isButtonDisabled = isSubmitting || !dateFacture || !montantHt || (sens === 'vente' && isPrestation && !dateEncaissement)
  
  // Debug simple pour cas problématiques
  const shouldBeEnabled = dateFacture && montantHt && !isSubmitting && 
    !(sens === 'vente' && isPrestation && !dateEncaissement)
  
  if (shouldBeEnabled && isButtonDisabled) {
    console.log('🐛 Bouton devrait être activé mais ne l\'est pas:', {
      dateFacture: !!dateFacture,
      montantHt: !!montantHt,
      isSubmitting,
      sens,
      isPrestation,
      dateEncaissement: !!dateEncaissement
    })
  }

  // Auto-calcul TVA pour ventes
  useEffect(() => {
    if (sens === 'vente' && montantHt) {
      const tvaRate = 0.2 // TOUJOURS 20% pour toutes les ventes (prestations ET biens)
      setMontantTva((montantHtNum * tvaRate).toFixed(2))
    }
  }, [montantHt, sens, montantHtNum])


  // État pour savoir si Tauri est disponible
  const [isTauriMode, setIsTauriMode] = useState(false)

  // Configuration Tauri drag & drop
  useEffect(() => {
    let unlisten: (() => void) | null = null

    const setupTauriDragDrop = async () => {
      try {
        // Vérifier si on est dans Tauri
        if (typeof window !== 'undefined' && (window as any).__TAURI_IPC__) {
          console.log('🔧 Initialisation Tauri drag & drop...')
          setIsTauriMode(true)
          
          const currentWebview = getCurrentWebview()
          console.log('✅ getCurrentWebview obtenu:', currentWebview)
          
          unlisten = await currentWebview.onDragDropEvent((event) => {
            // Ne logger que les événements importants (pas les survols)
            if (event.payload.type !== 'over') {
              console.log('🎯 TAURI DRAG DROP EVENT:', event.payload.type)
            }
            
            if (event.payload.type === 'over') {
              setDragActive(true)
            } else if (event.payload.type === 'cancelled') {
              console.log('❌ Drag annulé')
              setDragActive(false)
            } else if (event.payload.type === 'drop') {
              console.log('💧 Drop détecté! Paths:', event.payload.paths)
              setDragActive(false)
              const paths = event.payload.paths
              if (paths && paths.length > 0) {
                console.log('📂 Traitement fichier:', paths[0])
                handleTauriFileDrop(paths[0])
              }
            }
          })
          
          console.log('✅ Listener Tauri drag & drop configuré')
        } else {
          console.log('📱 Mode web - drag & drop HTML5 utilisé')
          setIsTauriMode(false)
        }
      } catch (error) {
        console.error('❌ Erreur setup Tauri drag & drop:', error)
        setIsTauriMode(false)
      }
    }

    setupTauriDragDrop()

    return () => {
      if (unlisten) {
        console.log('🧹 Nettoyage listener Tauri')
        unlisten()
      }
    }
  }, [])

  // Fonction pour gérer les fichiers droppés via Tauri
  const handleTauriFileDrop = async (filePath: string) => {
    try {
      console.log('📂 Fichier Tauri dropped:', filePath)
      
      // Extraire le nom du fichier
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'fichier'
      
      // Validation du fichier basée sur le nom
      const validation = validateFile({
        name: fileName,
        size: 0, // On ne connaît pas la taille exacte depuis le drag & drop Tauri
        type: '' // On déterminera le type via l'extension
      } as File)
      
      if (!validation.valid) {
        setUploadError(validation.error || 'Fichier invalide')
        return
      }
      
      // Upload réel vers MinIO
      setIsUploading(true)
      setUploadError(null)
      
      try {
        // Lire le fichier depuis le système de fichiers avec la commande Tauri dédiée
        console.log('📁 Lecture du fichier:', filePath)
        
        // Déterminer le type MIME basé sur l'extension
        const extension = fileName.toLowerCase().split('.').pop()
        const mimeType = extension === 'pdf' ? 'application/pdf' : 
                        extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
                        extension === 'png' ? 'image/png' : 'application/octet-stream'
        
        // Appeler la commande Tauri pour lire et uploader le fichier directement
        let url: string
        if (isTauriMode && (window as any).__TAURI_IPC__) {
          url = await invoke<string>('cmd_upload_file_from_path', {
            filePath: filePath,
            originalFilename: fileName,
            contentType: mimeType
          })
        } else {
          // Mode web - simulation
          console.log('🌐 Mode web - simulation d\'upload')
          url = `file://${filePath}`
        }
        
        setUploadedFile({
          name: fileName,
          url: url
        })
        
        console.log('✅ Fichier uploadé vers MinIO:', url)
      } catch (uploadError) {
        setUploadError('Erreur lors de l\'upload vers MinIO')
        console.error('❌ Erreur upload fichier Tauri:', uploadError)
      } finally {
        setIsUploading(false)
      }
    } catch (error) {
      console.error('❌ Erreur traitement fichier Tauri:', error)
      setUploadError('Erreur lors du traitement du fichier')
      setIsUploading(false)
    }
  }

  // Gestion du drag & drop (fallback HTML5)
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Ne désactiver que si on sort vraiment de la zone de drop
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileUpload(files[0])
      // Reset l'input pour permettre de sélectionner le même fichier
      e.target.value = ''
    }
  }

  const handleFileUpload = async (file: File) => {
    // Reset états précédents
    setUploadError(null)
    setUploadedFile(null)
    
    // Validation du fichier
    const validation = validateFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || 'Fichier invalide')
      return
    }
    
    setIsUploading(true)
    console.log('📎 Upload fichier:', file.name, 'Taille:', Math.round(file.size / 1024), 'KB')
    
    try {
      const url = await uploadToMinIO(file)
      setUploadedFile({
        name: file.name,
        url: url
      })
      console.log('✅ Fichier uploadé:', url)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue'
      setUploadError(errorMsg)
      console.error('❌ Erreur upload:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation des champs requis
    if (!dateFacture || !montantHt) {
      console.log('❌ Champs manquants:', { dateFacture, montantHt })
      return
    }
    
    // Validation date encaissement pour prestations
    if (sens === 'vente' && isPrestation && !dateEncaissement) {
      console.log('❌ Date encaissement manquante pour prestation')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('🚀 Création de l\'opération via Tauri...')
      
      // Préparer les données pour la commande Tauri selon CreateOperationDto
      const operationDto = {
        date_facture: dateFacture,
        date_encaissement: sens === 'vente' && isPrestation ? dateEncaissement : null,
        date_paiement: sens === 'achat' ? (datePaiement || dateFacture) : null,
        sens,
        montant_ht_cents: Math.round(montantHtNum * 100),
        montant_tva_cents: Math.round(montantTvaNum * 100),
        tva_sur_encaissements: sens === 'vente' ? isPrestation : false,
        libelle: libelle || `${sens === 'vente' ? 'Vente' : 'Achat'} ${dateFacture}`,
        justificatif_url: uploadedFile?.url || null
      }
      
      console.log('📤 Envoi à Tauri:', operationDto)
      
      // Appel vers la commande Tauri pour création (avec fallback web)
      let operationId: string
      if (isTauriMode && (window as any).__TAURI_IPC__) {
        operationId = await invoke<string>('cmd_create_operation', { dto: operationDto })
      } else {
        // Mode web - simulation pour les tests
        console.log('🌐 Mode web - simulation de création d\'opération')
        operationId = `web-op-${Date.now()}`
      }
      console.log('✅ Opération créée avec succès:', operationId)
      setSuccessMessage(`✅ Opération ${sens} créée avec succès !`)
      
      setSubmitError(null)
      
      // Reset du formulaire
      setDateFacture('')
      setDateEncaissement('')
      setDatePaiement('')
      setMontantHt('')
      setMontantTva('')
      setLibelle('')
      setUploadedFile(null)
      setUploadError(null)
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSuccessMessage(null), 3000)
      
      // Focus retour au premier champ
      firstInputRef.current?.focus()
      
      // Notifier la liste des opérations de se rafraîchir
      window.dispatchEvent(new Event('operations-updated'))
      
      // Notifier le parent
      onOperationAdded?.()
    } catch (error) {
      console.error('❌ Erreur création opération:', error)
      setSubmitError(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      setSuccessMessage(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }


  // Test Tauri API
  const testTauriAPI = async () => {
    try {
      console.log('🧪 Test API Tauri...')
      
      // Test 1: getCurrentWebview
      const currentWebview = getCurrentWebview()
      console.log('✅ getCurrentWebview:', currentWebview)
      
      // Test 2: invoke simple
      const testInvoke = await invoke('cmd_get_settings')
      console.log('✅ Invoke test réussi:', testInvoke)
      
      // Test 3: lister les opérations
      const operations = await invoke('cmd_list_operations', { month: null, m: null })
      console.log('✅ Opérations en base:', operations)
      
      alert(`✅ API Tauri OK! ${Array.isArray(operations) ? operations.length : 0} opérations trouvées. Vérifiez la console.`)
    } catch (error) {
      console.error('❌ API Tauri ne fonctionne pas:', error)
      alert('❌ API Tauri ERROR: ' + (error instanceof Error ? error.message : error))
    }
  }

  return (
    <div className="card mb-6 relative overflow-hidden">
      {/* Header visual accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 opacity-60"></div>
      
      <div className="p-4">
        {/* Messages de feedback */}
        {successMessage && (
          <div className="mb-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm flex items-center animate-in">
            <CheckCircle className="h-4 w-4 mr-2" />
            {successMessage}
          </div>
        )}
        
        {submitError && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center animate-in">
            <AlertCircle className="h-4 w-4 mr-2" />
            {submitError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4" onKeyDown={handleKeyDown}>
          
          {/* Ligne 1: Type, Nature, Dates */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-400">Type</label>
              <select
                ref={firstInputRef}
                value={sens}
                onChange={(e) => setSens(e.target.value as 'vente' | 'achat')}
                className="form-input form-select w-28"
              >
                <option value="vente">🟢 Vente</option>
                <option value="achat">🔴 Achat</option>
              </select>
            </div>

            {sens === 'vente' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-400">Nature</label>
                <select
                  value={isPrestation ? 'prestation' : 'bien'}
                  onChange={(e) => setIsPrestation(e.target.value === 'prestation')}
                  className="form-input form-select w-32"
                >
                  <option value="prestation">Prestation</option>
                  <option value="bien">Bien</option>
                </select>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-400">
                Date facture <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={dateFacture}
                onChange={(e) => setDateFacture(e.target.value)}
                className="form-input w-40"
                required
              />
            </div>

            {sens === 'vente' && isPrestation && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-400">
                  Encaissement <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={dateEncaissement}
                  onChange={(e) => setDateEncaissement(e.target.value)}
                  className="form-input w-40"
                  required
                />
              </div>
            )}

            {sens === 'achat' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-400">Date paiement</label>
                <input
                  type="date"
                  value={datePaiement}
                  onChange={(e) => setDatePaiement(e.target.value)}
                  className="form-input w-40"
                />
              </div>
            )}
          </div>

          {/* Ligne 2: Montants et bouton */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-400">
                HT € <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={montantHt}
                onChange={(e) => setMontantHt(e.target.value)}
                className="form-input font-mono text-sm w-24"
                placeholder="0.00"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-400">TVA €</label>
              <input
                type="number"
                step="0.01"
                value={montantTva}
                onChange={(e) => setMontantTva(e.target.value)}
                className={`form-input font-mono text-sm w-24 ${sens === 'vente' ? 'text-orange-400 bg-slate-800/50' : ''}`}
                placeholder="0.00"
                readOnly={sens === 'vente'}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-400">TTC €</label>
              <div className="form-input bg-gradient-to-r from-slate-700 to-slate-800 text-green-400 font-mono text-sm border-slate-600 w-24">
                {montantTtc.toFixed(2)}
              </div>
            </div>

            <div className="flex flex-col gap-2 justify-end">
              <div className="text-xs text-slate-500 text-center">⌘+⏎</div>
              <button
                type="submit"
                disabled={isButtonDisabled}
                className="btn btn-success px-4 py-2 text-sm"
              >
                {isSubmitting ? '⏳' : <Plus className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Ligne 3: Description et justificatif */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-700/30">
            <div className="flex-1">
              <input
                type="text"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                className="form-input text-sm"
                placeholder="Description (optionnelle)"
              />
            </div>
            
            <div className="flex-shrink-0 relative">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragEnter={!isTauriMode ? handleDragEnter : undefined}
                onDragLeave={!isTauriMode ? handleDragLeave : undefined}
                onDragOver={!isTauriMode ? handleDragOver : undefined}
                onDrop={!isTauriMode ? handleDrop : undefined}
                className={`flex items-center gap-2 px-3 py-2 border-2 border-dashed rounded transition-colors text-xs ${
                  isUploading 
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400 cursor-wait'
                    : uploadedFile
                    ? 'border-green-500 bg-green-500/10 text-green-400 cursor-pointer'
                    : uploadError
                    ? 'border-red-500 bg-red-500/10 text-red-400 cursor-pointer'
                    : dragActive 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 cursor-pointer' 
                    : 'border-slate-700 hover:border-slate-600 bg-slate-900/40 text-slate-400 cursor-pointer'
                }`}
                title={uploadedFile ? `Fichier: ${uploadedFile.name}` : uploadError || 'Cliquer ou glisser un fichier PDF/image'}
              >
                {isUploading ? (
                  <div className="animate-spin w-3 h-3 border border-orange-400 border-t-transparent rounded-full" />
                ) : uploadedFile ? (
                  <CheckCircle className="h-3 w-3" />
                ) : uploadError ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                <span>
                  {isUploading ? 'Upload...' : uploadedFile ? '✓ PDF' : uploadError ? '✗ PDF' : 'PDF'}
                </span>
              </div>
              
              {/* Affichage d'erreur sous le bouton */}
              {uploadError && (
                <div className="absolute top-full left-0 mt-1 p-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300 whitespace-nowrap z-10">
                  {uploadError}
                </div>
              )}
            </div>
          </div>

        </form>
        
      </div>
      
    </div>
  )
}