import React, { useState, useRef, useEffect } from 'react'
import { Upload, Check, X, Calendar, Euro, FileText } from 'lucide-react'
import { useFileUpload } from '../hooks/useFileUpload'
import { TauriClient } from '../lib/tauriClient'
import type { CreateOperationDto, Operation } from '../types'

interface CompactOperationFormProps {
  onOperationCreated: (operation: Operation) => void
  onCancel?: () => void
  className?: string
}

type OperationType = 'sale' | 'purchase'
type SaleType = 'service' | 'goods'

interface FormData {
  operation_type: OperationType
  saleType: SaleType // Pour les ventes: prestation ou bien
  invoice_date: string
  payment_date: string // Pour prestations uniquement
  amount_ht: string
  vat_euros: string // Pour achats: montant TVA en euros
  label: string
  file: File | null
}

const CompactOperationForm: React.FC<CompactOperationFormProps> = ({
  onOperationCreated,
  onCancel,
  className = ''
}) => {
  const { uploadFile, uploadState, resetUpload } = useFileUpload({
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/*', 'application/pdf', 'text/*']
  })

  const [formData, setFormData] = useState<FormData>({
    operation_type: 'sale',
    saleType: 'service',
    invoice_date: new Date().toISOString().split('T')[0],
    payment_date: new Date().toISOString().split('T')[0],
    amount_ht: '',
    vat_euros: '',
    label: '',
    file: null
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragActive, setDragActive] = useState(false)

  // Refs pour navigation clavier
  const sensRef = useRef<HTMLSelectElement>(null)
  const venteTypeRef = useRef<HTMLSelectElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const dateEncaissementRef = useRef<HTMLInputElement>(null)
  const montantHTRef = useRef<HTMLInputElement>(null)
  const tvaEurosRef = useRef<HTMLInputElement>(null)
  const libelleRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calculs automatiques
  const montantHTCents = Math.round(parseFloat(formData.montantHT || '0') * 100)
  const tvaRate = formData.sens === 'vente' ? 10 : 0 // 10% pour prestations, variable pour achats
  const tvaEurosCents = formData.sens === 'achat' 
    ? Math.round(parseFloat(formData.tvaEuros || '0') * 100)
    : Math.round(montantHTCents * tvaRate / 100)
  const montantTTCCents = montantHTCents + tvaEurosCents
  const montantTTC = (montantTTCCents / 100).toFixed(2)

  // Focus au montage
  useEffect(() => {
    sensRef.current?.focus()
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent, nextRef?: React.RefObject<HTMLElement>) => {
    if (event.key === 'Tab' && nextRef?.current) {
      event.preventDefault()
      nextRef.current.focus()
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      handleSubmit(event as any)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) newErrors.date = 'Date requise'
    if (formData.sens === 'vente' && formData.venteType === 'prestation' && !formData.dateEncaissement) {
      newErrors.dateEncaissement = 'Date d\'encaissement requise pour les prestations'
    }
    if (!formData.montantHT || parseFloat(formData.montantHT) <= 0) {
      newErrors.montantHT = 'Montant HT requis'
    }
    if (formData.sens === 'achat' && (!formData.tvaEuros || parseFloat(formData.tvaEuros) < 0)) {
      newErrors.tvaEuros = 'Montant TVA requis pour les achats'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Upload du fichier si présent
      let justificatifUrl: string | undefined

      if (formData.file) {
        justificatifUrl = await uploadFile(formData.file) || undefined
      }

      // Calcul des données selon la logique métier française
      const tvaRate = formData.sens === 'vente' ? 10 : 0 // 10% prestations, variable achats
      const tvaAuEncaissements = formData.sens === 'vente' && formData.venteType === 'prestation'
      
      const dto: CreateOperationDto = {
        sens: formData.sens,
        montant_ht: montantHTCents,
        tva_rate: tvaRate,
        tva_sur_encaissements: tvaAuEncaissements,
        date: formData.date,
        encaissement_date: tvaAuEncaissements ? formData.dateEncaissement : undefined,
        libelle: formData.libelle || undefined,
        justificatif_url: justificatifUrl
      }

      const operation = await TauriClient.createOperation(dto)
      onOperationCreated(operation)

      // Reset form
      setFormData({
        sens: 'vente',
        venteType: 'prestation',
        date: new Date().toISOString().split('T')[0],
        dateEncaissement: new Date().toISOString().split('T')[0],
        montantHT: '',
        tvaEuros: '',
        libelle: '',
        file: null
      })
      setErrors({})
      resetUpload()

      // Focus retour au début
      sensRef.current?.focus()

    } catch (error) {
      console.error('Erreur création opération:', error)
      setErrors({ general: 'Erreur lors de la création de l\'opération' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setFormData(prev => ({ ...prev, file: files[0] }))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const isVente = formData.sens === 'vente'
  const isPrestation = isVente && formData.venteType === 'prestation'
  const showDateEncaissement = isPrestation

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {/* Titre compact */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Nouvelle opération
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Ligne principale ultra-compacte */}
        <div className="grid grid-cols-12 gap-2 items-end">
          {/* Type d'opération */}
          <div className="col-span-1">
            <select
              ref={sensRef}
              value={formData.sens}
              onChange={(e) => setFormData(prev => ({ ...prev, sens: e.target.value as OperationType }))}
              onKeyDown={(e) => handleKeyDown(e, isVente ? venteTypeRef : dateRef)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="vente">Vente</option>
              <option value="achat">Achat</option>
            </select>
          </div>

          {/* Type de vente (si vente) */}
          {isVente && (
            <div className="col-span-2">
              <select
                ref={venteTypeRef}
                value={formData.venteType}
                onChange={(e) => setFormData(prev => ({ ...prev, venteType: e.target.value as VenteType }))}
                onKeyDown={(e) => handleKeyDown(e, dateRef)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="prestation">Prestation</option>
                <option value="bien">Bien</option>
              </select>
            </div>
          )}

          {/* Date facture */}
          <div className={`${isVente ? 'col-span-2' : 'col-span-3'}`}>
            <input
              ref={dateRef}
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              onKeyDown={(e) => handleKeyDown(e, showDateEncaissement ? dateEncaissementRef : montantHTRef)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.date && <span className="text-xs text-red-500">{errors.date}</span>}
          </div>

          {/* Date encaissement (si prestation) */}
          {showDateEncaissement && (
            <div className="col-span-2">
              <input
                ref={dateEncaissementRef}
                type="date"
                value={formData.dateEncaissement}
                onChange={(e) => setFormData(prev => ({ ...prev, dateEncaissement: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, montantHTRef)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Encaissement"
              />
              {errors.dateEncaissement && <span className="text-xs text-red-500">{errors.dateEncaissement}</span>}
            </div>
          )}

          {/* Montant HT */}
          <div className={`${isVente && !showDateEncaissement ? 'col-span-2' : showDateEncaissement ? 'col-span-2' : 'col-span-2'}`}>
            <input
              ref={montantHTRef}
              type="number"
              step="0.01"
              value={formData.montantHT}
              onChange={(e) => setFormData(prev => ({ ...prev, montantHT: e.target.value }))}
              onKeyDown={(e) => handleKeyDown(e, formData.sens === 'achat' ? tvaEurosRef : libelleRef)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="HT €"
            />
            {errors.montantHT && <span className="text-xs text-red-500">{errors.montantHT}</span>}
          </div>

          {/* TVA € (si achat) */}
          {formData.sens === 'achat' && (
            <div className="col-span-1">
              <input
                ref={tvaEurosRef}
                type="number"
                step="0.01"
                value={formData.tvaEuros}
                onChange={(e) => setFormData(prev => ({ ...prev, tvaEuros: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, libelleRef)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="TVA €"
              />
              {errors.tvaEuros && <span className="text-xs text-red-500">{errors.tvaEuros}</span>}
            </div>
          )}

          {/* Libellé */}
          <div className={`${formData.sens === 'achat' ? 'col-span-3' : isVente && !showDateEncaissement ? 'col-span-3' : showDateEncaissement ? 'col-span-2' : 'col-span-3'}`}>
            <input
              ref={libelleRef}
              type="text"
              value={formData.libelle}
              onChange={(e) => setFormData(prev => ({ ...prev, libelle: e.target.value }))}
              onKeyDown={(e) => handleKeyDown(e, submitRef)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description (optionnel)"
            />
          </div>

          {/* Zone de drop de fichier compacte */}
          <div className="col-span-1">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative h-8 border-2 border-dashed rounded cursor-pointer transition-colors flex items-center justify-center
                ${dragActive 
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : formData.file
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }
              `}
            >
              {uploadState.isUploading ? (
                <div className="text-xs text-blue-600">{uploadState.progress}%</div>
              ) : formData.file ? (
                <FileText className="h-3 w-3 text-green-600" />
              ) : (
                <Upload className="h-3 w-3 text-gray-400" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setFormData(prev => ({ ...prev, file }))
              }}
              accept="image/*,.pdf,.txt,.doc,.docx"
              className="hidden"
            />
          </div>

          {/* Bouton validation */}
          <div className="col-span-1">
            <button
              ref={submitRef}
              type="submit"
              disabled={isSubmitting || uploadState.isUploading}
              className="w-full h-8 px-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        {/* Calculs automatiques */}
        {formData.montantHT && (
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded">
            <span>HT: {formData.montantHT}€</span>
            <span>TVA: {(tvaEurosCents / 100).toFixed(2)}€</span>
            <span className="font-medium">TTC: {montantTTC}€</span>
            {formData.sens === 'vente' && (
              <span className="text-blue-600">
                TVA {isPrestation ? 'sur encaissement' : 'sur facturation'}
              </span>
            )}
          </div>
        )}

        {/* Erreurs */}
        {Object.keys(errors).length > 0 && (
          <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <div key={field}>{message}</div>
            ))}
          </div>
        )}

        {/* Info fichier */}
        {formData.file && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            📎 {formData.file.name} ({Math.round(formData.file.size / 1024)}KB)
          </div>
        )}

        {/* Aide navigation */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Tab: champ suivant • ⌘+Entrée: valider
        </div>
      </form>
    </div>
  )
}

export default CompactOperationForm