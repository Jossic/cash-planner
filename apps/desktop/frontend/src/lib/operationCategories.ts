/**
 * Types et utilitaires pour les catégories d'opérations
 * 
 * Fournit une taxonomie standardisée des opérations d'achat et vente
 * pour les freelances français avec les bonnes catégorisations fiscales.
 */

// =============================================================================
// TYPES DE CATÉGORIES
// =============================================================================

export interface OperationCategory {
  id: string
  label: string
  description?: string
  defaultVatRate: number
  sens: 'achat' | 'vente' | 'both'
  isDeductible?: boolean // Pour les achats
  fiscalCode?: string    // Code comptable
  parent?: string        // Catégorie parente
  order: number          // Ordre d'affichage
}

export interface CategoryGroup {
  id: string
  label: string
  description?: string
  categories: OperationCategory[]
  sens: 'achat' | 'vente' | 'both'
  order: number
}

// =============================================================================
// CATÉGORIES DE VENTES (PRESTATIONS/PRODUITS)
// =============================================================================

export const VENTE_CATEGORIES: OperationCategory[] = [
  // Services informatiques
  {
    id: 'dev_web',
    label: 'Développement web',
    description: 'Création de sites web, applications',
    defaultVatRate: 20,
    sens: 'vente',
    fiscalCode: '706',
    order: 1
  },
  {
    id: 'dev_mobile',
    label: 'Développement mobile',
    description: 'Applications iOS, Android',
    defaultVatRate: 20,
    sens: 'vente',
    fiscalCode: '706',
    order: 2
  },
  {
    id: 'consulting_it',
    label: 'Conseil informatique',
    description: 'Audit, architecture, conseil technique',
    defaultVatRate: 20,
    sens: 'vente',
    fiscalCode: '706',
    order: 3
  },
  
  // Design et création
  {
    id: 'design_graph',
    label: 'Design graphique',
    description: 'Logo, identité visuelle, supports',
    defaultVatRate: 20,
    sens: 'vente',
    fiscalCode: '706',
    order: 10
  },
  {
    id: 'design_web',
    label: 'Design web/UI',
    description: 'Interface utilisateur, expérience',
    defaultVatRate: 20,
    sens: 'vente',
    fiscalCode: '706',
    order: 11
  },
  
  // Formation et accompagnement
  {
    id: 'formation',
    label: 'Formation',
    description: 'Formation professionnelle',
    defaultVatRate: 0, // Exonéré sous conditions
    sens: 'vente',
    fiscalCode: '706',
    order: 20
  },
  {
    id: 'coaching',
    label: 'Coaching/Accompagnement',
    description: 'Accompagnement professionnel',
    defaultVatRate: 20,
    sens: 'vente',
    fiscalCode: '706',
    order: 21
  },
  
  // Marketing et communication
  {
    id: 'marketing',
    label: 'Marketing digital',
    description: 'SEO, publicité, stratégie',
    defaultVatRate: 20,
    sens: 'vente',
    fiscalCode: '706',
    order: 30
  },
  {
    id: 'content_creation',
    label: 'Création de contenu',
    description: 'Rédaction, vidéo, podcasts',
    defaultVatRate: 20,
    sens: 'vente',
    fiscalCode: '706',
    order: 31
  },
  
  // Autres prestations
  {
    id: 'maintenance',
    label: 'Maintenance/Support',
    description: 'Maintenance de systèmes, support',
    defaultVatRate: 20,
    sens: 'vente',
    fiscalCode: '706',
    order: 40
  },
  {
    id: 'autre_prestation',
    label: 'Autre prestation',
    description: 'Autres services',
    defaultVatRate: 20,
    sens: 'vente',
    fiscalCode: '706',
    order: 99
  }
]

// =============================================================================
// CATÉGORIES D'ACHATS (CHARGES/INVESTISSEMENTS)
// =============================================================================

export const ACHAT_CATEGORIES: OperationCategory[] = [
  // Matériel informatique
  {
    id: 'materiel_info',
    label: 'Matériel informatique',
    description: 'Ordinateurs, périphériques, serveurs',
    defaultVatRate: 20,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '2183',
    order: 1
  },
  {
    id: 'logiciels',
    label: 'Logiciels et licences',
    description: 'Licences logicielles, SaaS, outils',
    defaultVatRate: 20,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '6061',
    order: 2
  },
  
  // Services externes
  {
    id: 'hebergement',
    label: 'Hébergement/Cloud',
    description: 'Serveurs, stockage, CDN',
    defaultVatRate: 20,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '6061',
    order: 10
  },
  {
    id: 'domaines',
    label: 'Noms de domaine',
    description: 'Achat et renouvellement domaines',
    defaultVatRate: 20,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '6061',
    order: 11
  },
  {
    id: 'sous_traitance',
    label: 'Sous-traitance',
    description: 'Prestations externes, freelances',
    defaultVatRate: 20,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '611',
    order: 12
  },
  
  // Marketing et communication
  {
    id: 'publicite',
    label: 'Publicité',
    description: 'Google Ads, Facebook Ads, etc.',
    defaultVatRate: 20,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '623',
    order: 20
  },
  {
    id: 'communication',
    label: 'Communication',
    description: 'Site web, supports marketing',
    defaultVatRate: 20,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '623',
    order: 21
  },
  
  // Bureau et déplacements
  {
    id: 'bureau',
    label: 'Fournitures de bureau',
    description: 'Papeterie, mobilier, équipement',
    defaultVatRate: 20,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '6064',
    order: 30
  },
  {
    id: 'transport',
    label: 'Transport/Déplacement',
    description: 'Train, avion, essence, parking',
    defaultVatRate: 10,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '6251',
    order: 31
  },
  {
    id: 'repas',
    label: 'Repas d\'affaires',
    description: 'Restaurant, repas clients',
    defaultVatRate: 10,
    sens: 'achat',
    isDeductible: true, // Partiellement (75%)
    fiscalCode: '6257',
    order: 32
  },
  
  // Formation et développement
  {
    id: 'formation_achat',
    label: 'Formation professionnelle',
    description: 'Cours, certifications, conférences',
    defaultVatRate: 0, // Souvent exonéré
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '6313',
    order: 40
  },
  {
    id: 'livres',
    label: 'Documentation technique',
    description: 'Livres, magazines, ressources',
    defaultVatRate: 5.5,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '6064',
    order: 41
  },
  
  // Services professionnels
  {
    id: 'comptable',
    label: 'Services comptables',
    description: 'Expert-comptable, logiciel compta',
    defaultVatRate: 20,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '6226',
    order: 50
  },
  {
    id: 'juridique',
    label: 'Services juridiques',
    description: 'Avocat, notaire, conseils',
    defaultVatRate: 20,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '6227',
    order: 51
  },
  {
    id: 'assurance',
    label: 'Assurances',
    description: 'RC Pro, multirisque, santé',
    defaultVatRate: 0, // Exonéré
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '6161',
    order: 52
  },
  {
    id: 'banque',
    label: 'Frais bancaires',
    description: 'Frais de compte, virements',
    defaultVatRate: 0, // Exonéré
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '627',
    order: 53
  },
  
  // Divers
  {
    id: 'autre_achat',
    label: 'Autres achats',
    description: 'Autres dépenses professionnelles',
    defaultVatRate: 20,
    sens: 'achat',
    isDeductible: true,
    fiscalCode: '606',
    order: 99
  }
]

// =============================================================================
// GROUPES DE CATÉGORIES
// =============================================================================

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'ventes_services',
    label: 'Prestations de services',
    description: 'Services vendus aux clients',
    categories: VENTE_CATEGORIES,
    sens: 'vente',
    order: 1
  },
  {
    id: 'achats_materiel',
    label: 'Matériel et équipement',
    description: 'Investissements matériels',
    categories: ACHAT_CATEGORIES.filter(cat => ['materiel_info', 'logiciels', 'bureau'].includes(cat.id)),
    sens: 'achat',
    order: 2
  },
  {
    id: 'achats_services',
    label: 'Services externes',
    description: 'Prestations sous-traitées',
    categories: ACHAT_CATEGORIES.filter(cat => ['hebergement', 'domaines', 'sous_traitance'].includes(cat.id)),
    sens: 'achat',
    order: 3
  },
  {
    id: 'achats_marketing',
    label: 'Marketing et communication',
    description: 'Promotion et publicité',
    categories: ACHAT_CATEGORIES.filter(cat => ['publicite', 'communication'].includes(cat.id)),
    sens: 'achat',
    order: 4
  },
  {
    id: 'achats_fonctionnement',
    label: 'Frais de fonctionnement',
    description: 'Charges courantes',
    categories: ACHAT_CATEGORIES.filter(cat => 
      ['transport', 'repas', 'comptable', 'juridique', 'assurance', 'banque'].includes(cat.id)
    ),
    sens: 'achat',
    order: 5
  }
]

// =============================================================================
// UTILITAIRES
// =============================================================================

/**
 * Récupère toutes les catégories pour un sens donné
 */
export const getCategoriesForSens = (sens: 'achat' | 'vente'): OperationCategory[] => {
  return sens === 'vente' ? VENTE_CATEGORIES : ACHAT_CATEGORIES
}

/**
 * Récupère une catégorie par son ID
 */
export const getCategoryById = (id: string): OperationCategory | undefined => {
  return [...VENTE_CATEGORIES, ...ACHAT_CATEGORIES].find(cat => cat.id === id)
}

/**
 * Récupère le taux de TVA par défaut pour une catégorie
 */
export const getDefaultVatRateForCategory = (categoryId: string): number => {
  const category = getCategoryById(categoryId)
  return category?.defaultVatRate || 20
}

/**
 * Vérifie si une catégorie est déductible (pour les achats)
 */
export const isCategoryDeductible = (categoryId: string): boolean => {
  const category = getCategoryById(categoryId)
  return category?.isDeductible || false
}

/**
 * Récupère les catégories sous forme d'options pour select
 */
export const getCategoryOptions = (sens: 'achat' | 'vente') => {
  return getCategoriesForSens(sens).map(category => ({
    value: category.id,
    label: category.label,
    description: category.description,
    defaultVatRate: category.defaultVatRate
  }))
}

/**
 * Récupère les catégories groupées pour un sens
 */
export const getGroupedCategoriesForSens = (sens: 'achat' | 'vente'): CategoryGroup[] => {
  return CATEGORY_GROUPS.filter(group => 
    group.sens === sens || group.sens === 'both'
  ).sort((a, b) => a.order - b.order)
}

/**
 * Recherche dans les catégories par texte
 */
export const searchCategories = (
  query: string, 
  sens?: 'achat' | 'vente'
): OperationCategory[] => {
  const categories = sens ? getCategoriesForSens(sens) : [...VENTE_CATEGORIES, ...ACHAT_CATEGORIES]
  const lowerQuery = query.toLowerCase()
  
  return categories.filter(category =>
    category.label.toLowerCase().includes(lowerQuery) ||
    category.description?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Suggère une catégorie basée sur le libellé de l'opération
 */
export const suggestCategory = (
  label: string, 
  sens: 'achat' | 'vente'
): OperationCategory | undefined => {
  const lowerLabel = label.toLowerCase()
  const categories = getCategoriesForSens(sens)
  
  // Mots-clés pour chaque catégorie
  const keywords: Record<string, string[]> = {
    // Ventes
    'dev_web': ['site', 'web', 'wordpress', 'html', 'css', 'javascript'],
    'dev_mobile': ['mobile', 'app', 'android', 'ios', 'react native'],
    'consulting_it': ['conseil', 'audit', 'architecture', 'consulting'],
    'design_graph': ['logo', 'design', 'graphique', 'identité'],
    'design_web': ['ui', 'ux', 'interface', 'maquette'],
    'formation': ['formation', 'cours', 'atelier', 'training'],
    'marketing': ['seo', 'marketing', 'publicité', 'ads'],
    'maintenance': ['maintenance', 'support', 'correction', 'bug'],
    
    // Achats
    'materiel_info': ['ordinateur', 'macbook', 'pc', 'souris', 'clavier', 'écran'],
    'logiciels': ['licence', 'logiciel', 'subscription', 'saas', 'adobe'],
    'hebergement': ['serveur', 'hébergement', 'vps', 'cloud', 'aws'],
    'domaines': ['domaine', 'domain', '.com', '.fr'],
    'publicite': ['ads', 'publicité', 'facebook', 'google'],
    'transport': ['train', 'avion', 'essence', 'taxi', 'uber'],
    'repas': ['restaurant', 'repas', 'déjeuner'],
    'formation_achat': ['formation', 'cours', 'conférence', 'certification'],
    'comptable': ['comptable', 'expert', 'compta'],
    'assurance': ['assurance', 'rc pro', 'mutuelle']
  }
  
  // Trouver la meilleure correspondance
  let bestMatch: OperationCategory | undefined
  let bestScore = 0
  
  categories.forEach(category => {
    const categoryKeywords = keywords[category.id] || []
    const score = categoryKeywords.reduce((acc, keyword) => {
      return acc + (lowerLabel.includes(keyword) ? 1 : 0)
    }, 0)
    
    if (score > bestScore) {
      bestScore = score
      bestMatch = category
    }
  })
  
  return bestMatch
}

/**
 * Valide qu'une catégorie est appropriée pour un sens
 */
export const validateCategoryForSens = (
  categoryId: string, 
  sens: 'achat' | 'vente'
): boolean => {
  const category = getCategoryById(categoryId)
  if (!category) return false
  
  return category.sens === sens || category.sens === 'both'
}

/**
 * Export des données pour les composants
 */
export const CATEGORY_DATA = {
  ventes: VENTE_CATEGORIES,
  achats: ACHAT_CATEGORIES,
  groups: CATEGORY_GROUPS,
  
  // Helpers rapides
  getOptions: getCategoryOptions,
  getByID: getCategoryById,
  getVatRate: getDefaultVatRateForCategory,
  isDeductible: isCategoryDeductible,
  suggest: suggestCategory,
  search: searchCategories,
  validate: validateCategoryForSens
} as const