import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Plus, Upload } from 'lucide-react'
import type { OperationFormData, CreateOperationDto } from '../../types'
import { useOperations, useCurrentPeriod } from '../../stores/useAppStore'

interface OperationQuickFormProps {
  onOperationAdded?: () => void
}

export const OperationQuickForm: React.FC<OperationQuickFormProps> = ({ onOperationAdded }) => {
  const currentPeriod = useCurrentPeriod()
  const { addOperation } = useOperations(currentPeriod.key)
  
  const [formData, setFormData] = useState<OperationFormData>({
    libelle: '',
    sens: 'vente',
    montant_ht: '',
    tva_rate: '20', // DÉFAUT 20% (pas 10% comme demandé)
    tva_sur_encaissements: true, // Défaut TVA sur encaissements
    date: new Date().toISOString().split('T')[0], // Aujourd'hui par défaut
    encaissement_date: '',
    justificatif_file: undefined
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Refs pour navigation clavier
  const libelleRef = useRef<HTMLInputElement>(null)
  const montantRef = useRef<HTMLInputElement>(null)
  const tvaRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const encaissementRef = useRef<HTMLInputElement>(null)
  
  // Focus sur le premier champ au montage
  useEffect(() => {
    libelleRef.current?.focus()
  }, [])
  
  const handleInputChange = (field: keyof OperationFormData, value: string | boolean | File) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    
    // Logique spécifique selon le type d'opération
    if (field === 'sens') {
      const newTvaRate = value === 'vente' ? '20' : '20' // DÉFAUT 20% pour TOUT (ventes et achats)
      setFormData(prev => ({ ...prev, tva_rate: newTvaRate }))
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement>) => {
    if (e.key === 'Tab' && !e.shiftKey && nextRef) {
      e.preventDefault()
      nextRef.current?.focus()
    } else if (e.key === 'Enter' && e.metaKey) {
      // Cmd/Alt + Enter pour soumettre
      e.preventDefault()
      handleSubmit()
    }
  }
  
  const validateForm = (): string | null => {
    if (!formData.montant_ht || parseFloat(formData.montant_ht) <= 0) {
      return 'Montant HT requis et doit être supérieur à 0'
    }
    
    if (!formData.tva_rate || parseFloat(formData.tva_rate) < 0) {
      return 'Taux TVA requis et doit être >= 0'
    }
    
    if (!formData.date) {
      return 'Date requise'
    }
    
    if (formData.tva_sur_encaissements && formData.sens === 'vente' && !formData.encaissement_date) {
      return 'Date d\'encaissement requise pour TVA sur encaissements'
    }
    
    return null
  }
  
  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Conversion des données du formulaire vers DTO
      const operationDto: CreateOperationDto = {
        libelle: formData.libelle || undefined,
        sens: formData.sens,
        montant_ht: Math.round(parseFloat(formData.montant_ht) * 100), // Conversion en centimes
        tva_rate: parseFloat(formData.tva_rate),
        tva_sur_encaissements: formData.tva_sur_encaissements,
        date: formData.date,
        encaissement_date: formData.encaissement_date || undefined,
        justificatif_url: undefined // TODO: Gérer l'upload de fichier
      }
      
      await addOperation(operationDto)
      
      // Reset du formulaire après succès
      setFormData({
        libelle: '',
        sens: formData.sens, // Garde le même type d'opération
        montant_ht: '',
        tva_rate: '20', // DÉFAUT 20%
        tva_sur_encaissements: formData.tva_sur_encaissements, // Garde la même config TVA
        date: new Date().toISOString().split('T')[0],
        encaissement_date: '',
        justificatif_file: undefined
      })
      
      // Focus sur le premier champ pour saisie rapide
      libelleRef.current?.focus()
      
      onOperationAdded?.()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleFileUpload = (file: File) => {
    // Vérification du type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('Type de fichier non supporté. Utilisez JPG, PNG ou PDF.')
      return
    }
    
    // Vérification de la taille (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('Fichier trop volumineux. Taille maximum : 5MB.')
      return
    }
    
    setError(null)
    setFormData(prev => ({ ...prev, justificatif_file: file }))
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }
  
  return (
    <div className="card animate-scale-in">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="card-title">Saisie rapide</h3>
              <p className="card-description">Navigation clavier optimisée</p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded-md">
            <kbd className="text-blue-400">Tab</kbd> → champ • <kbd className="text-blue-400">⌘+Enter</kbd> → valider
          </div>
        </div>
      </div>
      
      <div className="card-content">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg animate-shake">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {/* Nouvelle logique : Saisie HT + TVA → Calcul TTC automatique */}
        <div className="space-y-6">
          {/* Première ligne : Type + Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label form-label-required">Type d'opération</label>
              <select
                value={formData.sens}
                onChange={(e) => handleInputChange('sens', e.target.value as 'vente' | 'achat')}
                className="form-input form-select"
              >
                <option value="vente">🔼 Vente (Recette)</option>
                <option value="achat">🔽 Achat (Dépense)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                ref={libelleRef}
                type="text"
                placeholder="Description de l'opération (optionnel)"
                value={formData.libelle || ''}
                onChange={(e) => handleInputChange('libelle', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, montantRef)}
                className="form-input"
              />
            </div>
          </div>
          
          {/* Deuxième ligne : Montants avec calcul automatique */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-200 mb-4 flex items-center">
              <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-2 text-purple-400">
                €
              </span>
              Calcul automatique HT → TTC
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label form-label-required">Montant HT</label>
                <input
                  ref={montantRef}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.montant_ht}
                  onChange={(e) => handleInputChange('montant_ht', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, tvaRef)}
                  className="form-input text-lg font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">Montant hors taxes</p>
              </div>
              
              <div className="form-group">
                <label className="form-label form-label-required">Taux TVA</label>
                <div className="relative">
                  <input
                    ref={tvaRef}
                    type="number"
                    step="0.1"
                    placeholder="20"
                    value={formData.tva_rate}
                    onChange={(e) => handleInputChange('tva_rate', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, dateRef)}
                    className="form-input text-lg font-mono pr-8"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
                <p className="text-xs text-orange-400 mt-1">Défaut: 20%</p>
              </div>
              
              {/* Calcul TTC automatique affiché */}
              <div className="form-group">
                <label className="form-label">Montant TTC</label>
                <div className="form-input bg-slate-700/50 text-lg font-mono text-blue-400 cursor-not-allowed">
                  {formData.montant_ht && formData.tva_rate 
                    ? (parseFloat(formData.montant_ht) * (1 + parseFloat(formData.tva_rate) / 100)).toFixed(2)
                    : '0.00'
                  }
                </div>
                <p className="text-xs text-slate-400 mt-1">Calculé automatiquement</p>
              </div>
            </div>
          </div>
        
          {/* Troisième ligne : Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label form-label-required">Date d'opération</label>
              <input
                ref={dateRef}
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, encaissementRef)}
                className="form-input"
              />
            </div>
          
            {/* Date encaissement (si TVA sur encaissements) */}
            {formData.tva_sur_encaissements && formData.sens === 'vente' && (
              <div className="form-group">
                <label className="form-label form-label-required">Date encaissement</label>
                <input
                  ref={encaissementRef}
                  type="date"
                  value={formData.encaissement_date || ''}
                  onChange={(e) => handleInputChange('encaissement_date', e.target.value)}
                  className="form-input"
                />
                <p className="text-xs text-orange-400 mt-1">TVA due sur encaissement</p>
              </div>
            )}
          </div>
          
          {/* Quatrième section : Upload de justificatif avec drag & drop amélioré */}
          <div 
            className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer group transition-all duration-200 ${
              isDragOver 
                ? 'border-blue-500 bg-blue-500/10 scale-105' 
                : formData.justificatif_file
                ? 'border-green-500 bg-green-500/10'
                : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
              id="justificatif-upload"
            />
            <label htmlFor="justificatif-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                {formData.justificatif_file ? (
                  // État avec fichier
                  <>
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-green-400 text-xl">✓</span>
                    </div>
                    <h4 className="text-sm font-medium text-green-400 mb-1">
                      {formData.justificatif_file.name}
                    </h4>
                    <p className="text-xs text-green-400/70">
                      {(formData.justificatif_file.size / (1024 * 1024)).toFixed(1)} MB - Cliquez pour changer
                    </p>
                  </>
                ) : isDragOver ? (
                  // État drag over
                  <>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 animate-pulse">
                      <Upload className="h-6 w-6 text-blue-400" />
                    </div>
                    <h4 className="text-sm font-medium text-blue-400 mb-1">
                      Relâchez pour déposer le fichier
                    </h4>
                    <p className="text-xs text-blue-400/70">
                      PDF, JPG, PNG acceptés
                    </p>
                  </>
                ) : (
                  // État par défaut
                  <>
                    <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mb-3 group-hover:bg-slate-600 transition-colors">
                      <Upload className="h-6 w-6 text-slate-400 group-hover:text-slate-300" />
                    </div>
                    <h4 className="text-sm font-medium text-slate-300 mb-1">
                      Déposer un justificatif
                    </h4>
                    <p className="text-xs text-slate-500">
                      PDF, JPG, PNG - Glisser-déposer ou cliquer (5MB max)
                    </p>
                  </>
                )}
              </div>
            </label>
            
            {/* Animation d'upload */}
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-lg animate-pulse">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce mr-1"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce mr-1" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>
        
          {/* Options TVA */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-orange-500/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-orange-400 text-xs font-bold">%</span>
              </div>
              <label className="flex items-center cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={formData.tva_sur_encaissements}
                  onChange={(e) => handleInputChange('tva_sur_encaissements', e.target.checked)}
                  className="form-checkbox mr-3"
                />
                <div>
                  <span className="text-sm font-medium text-orange-300">TVA sur encaissements</span>
                  <p className="text-xs text-orange-400/70 mt-0.5">TVA due au moment du paiement (recommandé)</p>
                </div>
              </label>
            </div>
          </div>
        
          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <div className="text-xs text-slate-500">
              <span className="inline-flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Saisie rapide activée
              </span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-success btn-lg shadow-elevated"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter l'opération
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}