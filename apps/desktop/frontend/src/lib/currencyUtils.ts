/**
 * Utilitaires de conversion et formatage monétaire pour l'UI
 * 
 * Gère la conversion entre euros (affichage) et centimes (stockage)
 * avec formatage localisé français et validation des saisies.
 */

// =============================================================================
// CONSTANTS ET CONFIGURATION
// =============================================================================

export const CURRENCY_CONFIG = {
  locale: 'fr-FR',
  currency: 'EUR',
  decimalPlaces: 2,
  thousandSeparator: ' ', // Espace en français
  decimalSeparator: ',',  // Virgule en français
} as const

export const VAT_RATES = {
  NORMAL: 20,     // Taux normal
  REDUCED_1: 10,  // Taux réduit (restauration, transport, etc.)
  REDUCED_2: 5.5, // Taux super réduit (livres, alimentation de base)
  REDUCED_3: 2.1, // Taux particulier (médicaments, presse)
  ZERO: 0        // TVA à 0% (export, services non taxables)
} as const

// =============================================================================
// CONVERSION DE BASE
// =============================================================================

/**
 * Convertit des euros en centimes
 */
export const eurosTocents = (euros: number): number => {
  if (isNaN(euros) || !isFinite(euros)) return 0
  return Math.round(euros * 100)
}

/**
 * Convertit des centimes en euros
 */
export const centsToEuros = (cents: number): number => {
  if (isNaN(cents) || !isFinite(cents)) return 0
  return cents / 100
}

/**
 * Parse une chaîne de montant et retourne les centimes
 * Gère les formats français (virgule décimale, espaces)
 */
export const parseAmountToCents = (value: string): number => {
  if (!value || typeof value !== 'string') return 0
  
  // Nettoyer la chaîne : garder seulement chiffres, virgules et points
  const cleaned = value
    .replace(/[^0-9.,]/g, '') // Supprime tout sauf chiffres, virgules, points
    .replace(/\s/g, '')       // Supprime les espaces
    .replace(',', '.')        // Convertit virgule en point pour parseFloat
  
  const amount = parseFloat(cleaned)
  return eurosTocents(isNaN(amount) ? 0 : amount)
}

/**
 * Parse une chaîne de montant et retourne les euros
 */
export const parseAmountToEuros = (value: string): number => {
  return centsToEuros(parseAmountToCents(value))
}

// =============================================================================
// FORMATAGE POUR AFFICHAGE
// =============================================================================

/**
 * Formate un montant en centimes vers un affichage en euros (avec symbole €)
 */
export const formatCentsToEuros = (
  cents: number, 
  options: {
    showSymbol?: boolean
    showSign?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  } = {}
): string => {
  const {
    showSymbol = true,
    showSign = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options
  
  const euros = centsToEuros(cents)
  
  const formatter = new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: CURRENCY_CONFIG.currency,
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay: showSign ? 'always' : 'auto'
  })
  
  return formatter.format(euros)
}

/**
 * Formate un montant en euros vers un affichage (avec symbole €)
 */
export const formatEuros = (
  euros: number,
  options: Parameters<typeof formatCentsToEuros>[1] = {}
): string => {
  return formatCentsToEuros(eurosTocentimes(euros), options)
}

/**
 * Formate pour la saisie (sans symbole, avec virgule décimale)
 */
export const formatCentsForInput = (cents: number): string => {
  const euros = centsToEuros(cents)
  return euros.toFixed(CURRENCY_CONFIG.decimalPlaces).replace('.', ',')
}

/**
 * Formate pour la saisie en euros
 */
export const formatEurosForInput = (euros: number): string => {
  return formatCentsForInput(eurosTocentimes(euros))
}

// =============================================================================
// CALCULS TVA
// =============================================================================

/**
 * Calcule la TVA en centimes à partir du HT et du taux
 */
export const calculateTvaCents = (htCents: number, tvaRate: number): number => {
  if (isNaN(htCents) || isNaN(tvaRate) || tvaRate < 0) return 0
  return Math.round(htCents * tvaRate / 100)
}

/**
 * Calcule le TTC en centimes à partir du HT et du taux TVA
 */
export const calculateTtcCents = (htCents: number, tvaRate: number): number => {
  const tvaCents = calculateTvaCents(htCents, tvaRate)
  return htCents + tvaCents
}

/**
 * Calcule le HT en centimes à partir du TTC et du taux TVA
 */
export const calculateHtFromTtc = (ttcCents: number, tvaRate: number): number => {
  if (isNaN(ttcCents) || isNaN(tvaRate) || tvaRate < 0) return ttcCents
  const divisor = 1 + (tvaRate / 100)
  return Math.round(ttcCents / divisor)
}

/**
 * Calcule tous les montants à partir du HT
 */
export const calculateAllAmountsFromHt = (htCents: number, tvaRate: number) => {
  const tvaCents = calculateTvaCents(htCents, tvaRate)
  const ttcCents = htCents + tvaCents
  
  return {
    amount_ht_cents: htCents,
    tva_cents: tvaCents,
    amount_ttc_cents: ttcCents,
    // Formatage pour affichage
    ht_display: formatCentsToEuros(htCents),
    tva_display: formatCentsToEuros(tvaCents),
    ttc_display: formatCentsToEuros(ttcCents)
  }
}

/**
 * Calcule tous les montants à partir du TTC
 */
export const calculateAllAmountsFromTtc = (ttcCents: number, tvaRate: number) => {
  const htCents = calculateHtFromTtc(ttcCents, tvaRate)
  const tvaCents = ttcCents - htCents
  
  return {
    amount_ht_cents: htCents,
    tva_cents: tvaCents,
    amount_ttc_cents: ttcCents,
    // Formatage pour affichage
    ht_display: formatCentsToEuros(htCents),
    tva_display: formatCentsToEuros(tvaCents),
    ttc_display: formatCentsToEuros(ttcCents)
  }
}

// =============================================================================
// VALIDATION DE SAISIE
// =============================================================================

/**
 * Valide qu'une chaîne représente un montant valide
 */
export const isValidAmountString = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false
  
  // Regex pour montant français: chiffres avec virgule ou point décimal
  const frenchAmountRegex = /^\d{1,10}([,.]\d{1,2})?$/
  const cleaned = value.replace(/\s/g, '').replace(/€/g, '')
  
  return frenchAmountRegex.test(cleaned)
}

/**
 * Valide qu'un taux de TVA est correct
 */
export const isValidVatRate = (rate: number): boolean => {
  return !isNaN(rate) && rate >= 0 && rate <= 30
}

/**
 * Valide qu'un montant en centimes est dans les limites acceptables
 */
export const isValidAmountRange = (cents: number): boolean => {
  const maxAmount = 999999999 // 9,999,999.99 €
  return !isNaN(cents) && cents >= 0 && cents <= maxAmount
}

// =============================================================================
// HELPERS POUR COMPOSANTS
// =============================================================================

/**
 * Crée un formateur de saisie pour les inputs
 */
export const createAmountInputFormatter = () => {
  return {
    format: (value: string): string => {
      if (!value) return ''
      
      const cents = parseAmountToCents(value)
      return formatCentsForInput(cents)
    },
    
    parse: (value: string): number => {
      return parseAmountToCents(value)
    },
    
    validate: (value: string): { isValid: boolean; error?: string } => {
      if (!value.trim()) {
        return { isValid: false, error: 'Montant requis' }
      }
      
      if (!isValidAmountString(value)) {
        return { isValid: false, error: 'Format de montant invalide' }
      }
      
      const cents = parseAmountToCents(value)
      if (!isValidAmountRange(cents)) {
        return { isValid: false, error: 'Montant hors limites' }
      }
      
      if (cents === 0) {
        return { isValid: false, error: 'Le montant doit être positif' }
      }
      
      return { isValid: true }
    }
  }
}

/**
 * Helper pour les calculs de formulaire en temps réel
 */
export const createRealtimeCalculator = () => {
  return {
    calculateFromHt: (htString: string, tvaRateString: string) => {
      const htCents = parseAmountToCents(htString)
      const tvaRate = parseFloat(tvaRateString.replace(',', '.')) || 0
      
      return calculateAllAmountsFromHt(htCents, tvaRate)
    },
    
    calculateFromTtc: (ttcString: string, tvaRateString: string) => {
      const ttcCents = parseAmountToCents(ttcString)
      const tvaRate = parseFloat(tvaRateString.replace(',', '.')) || 0
      
      return calculateAllAmountsFromTtc(ttcCents, tvaRate)
    }
  }
}

// =============================================================================
// TYPES POUR TYPESCRIPT
// =============================================================================

export interface AmountCalculation {
  amount_ht_cents: number
  tva_cents: number
  amount_ttc_cents: number
  ht_display: string
  tva_display: string
  ttc_display: string
}

export interface AmountInputFormatter {
  format: (value: string) => string
  parse: (value: string) => number
  validate: (value: string) => { isValid: boolean; error?: string }
}

export interface RealtimeCalculator {
  calculateFromHt: (htString: string, tvaRateString: string) => AmountCalculation
  calculateFromTtc: (ttcString: string, tvaRateString: string) => AmountCalculation
}

// =============================================================================
// PRESET DE TAUX TVA
// =============================================================================

export const getVatRateOptions = () => [
  { value: VAT_RATES.ZERO, label: '0% - Exonéré', description: 'Export, formation, etc.' },
  { value: VAT_RATES.REDUCED_3, label: '2,1% - Médicaments', description: 'Médicaments remboursés' },
  { value: VAT_RATES.REDUCED_2, label: '5,5% - Alimentation', description: 'Produits alimentaires de base' },
  { value: VAT_RATES.REDUCED_1, label: '10% - Réduit', description: 'Restauration, transport' },
  { value: VAT_RATES.NORMAL, label: '20% - Normal', description: 'Taux standard' }
]

/**
 * Détermine le taux de TVA par défaut selon le type d'opération
 */
export const getDefaultVatRate = (
  sens: 'achat' | 'vente', 
  category?: string
): number => {
  // Pour les prestations de services, généralement 20%
  if (sens === 'vente') return VAT_RATES.NORMAL
  
  // Pour les achats, dépend de la catégorie
  if (category) {
    const lowerCategory = category.toLowerCase()
    
    if (lowerCategory.includes('alimentation') || lowerCategory.includes('nourriture')) {
      return VAT_RATES.REDUCED_2
    }
    
    if (lowerCategory.includes('restaurant') || lowerCategory.includes('repas')) {
      return VAT_RATES.REDUCED_1
    }
    
    if (lowerCategory.includes('export') || lowerCategory.includes('formation')) {
      return VAT_RATES.ZERO
    }
  }
  
  return VAT_RATES.NORMAL // Par défaut
}

// Alias pour cohérence avec le nom de fonction
export { eurosTocents as eurosTocentimes }