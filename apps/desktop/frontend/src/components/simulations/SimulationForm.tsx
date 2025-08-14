import React, { useState } from 'react'
import { Calculator, Target, Calendar, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '../ui'
import { validateNumber } from '../../lib/utils'
import type { SimulationParams } from '../../types'

interface SimulationFormProps {
  onSimulate: (params: SimulationParams) => void
  loading?: boolean
}

export const SimulationForm: React.FC<SimulationFormProps> = ({ onSimulate, loading }) => {
  const [params, setParams] = useState<SimulationParams>({
    target_annual_revenue: 60000,
    working_days_per_month: 20,
    vacation_days_per_year: 25,
    daily_rate: 400,
    vat_rate_ppm: 200000, // 20%
    urssaf_rate_ppm: 220000, // 22%
  })

  const [errors, setErrors] = useState<Partial<Record<keyof SimulationParams, string>>>({})

  const handleChange = (field: keyof SimulationParams, value: string) => {
    const numValue = parseFloat(value) || 0
    
    setParams(prev => ({
      ...prev,
      [field]: field.includes('ppm') ? numValue * 10000 : numValue
    }))

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SimulationParams, string>> = {}
    
    if (!params.target_annual_revenue || params.target_annual_revenue <= 0) {
      newErrors.target_annual_revenue = 'Le chiffre d\'affaires doit être supérieur à 0'
    }
    
    if (!params.working_days_per_month || params.working_days_per_month <= 0 || params.working_days_per_month > 31) {
      newErrors.working_days_per_month = 'Les jours travaillés doivent être entre 1 et 31'
    }
    
    if (params.vacation_days_per_year !== undefined && (params.vacation_days_per_year < 0 || params.vacation_days_per_year > 365)) {
      newErrors.vacation_days_per_year = 'Les jours de congés doivent être entre 0 et 365'
    }
    
    if (!params.daily_rate || params.daily_rate <= 0) {
      newErrors.daily_rate = 'Le taux journalier doit être supérieur à 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSimulate(params)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary-600" />
          <CardTitle>Paramètres de simulation</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue Target */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-secondary-600" />
            Objectif financier
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CA annuel cible (€)"
              type="number"
              step="1000"
              value={params.target_annual_revenue?.toString() || ''}
              onChange={(e) => handleChange('target_annual_revenue', e.target.value)}
              error={errors.target_annual_revenue}
              placeholder="60000"
            />
            <Input
              label="TJM actuel (€)"
              type="number"
              step="10"
              value={params.daily_rate?.toString() || ''}
              onChange={(e) => handleChange('daily_rate', e.target.value)}
              error={errors.daily_rate}
              placeholder="400"
            />
          </div>
        </div>

        {/* Working Schedule */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600" />
            Planning de travail
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Jours travaillés/mois"
              type="number"
              min="1"
              max="31"
              value={params.working_days_per_month?.toString() || ''}
              onChange={(e) => handleChange('working_days_per_month', e.target.value)}
              error={errors.working_days_per_month}
              placeholder="20"
            />
            <Input
              label="Jours de congés/an"
              type="number"
              min="0"
              max="365"
              value={params.vacation_days_per_year?.toString() || ''}
              onChange={(e) => handleChange('vacation_days_per_year', e.target.value)}
              error={errors.vacation_days_per_year}
              placeholder="25"
            />
          </div>
        </div>

        {/* Tax Rates */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent-600" />
            Taux de charges
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Taux TVA (%)"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={((params.vat_rate_ppm || 0) / 10000).toString()}
              onChange={(e) => handleChange('vat_rate_ppm', e.target.value)}
              error={errors.vat_rate_ppm}
              placeholder="20"
            />
            <Input
              label="Taux URSSAF (%)"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={((params.urssaf_rate_ppm || 0) / 10000).toString()}
              onChange={(e) => handleChange('urssaf_rate_ppm', e.target.value)}
              error={errors.urssaf_rate_ppm}
              placeholder="22"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            loading={loading}
            className="w-full"
            leftIcon={<Calculator className="h-4 w-4" />}
          >
            Calculer les projections
          </Button>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Comment utiliser cette simulation
          </h4>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Définissez votre objectif de CA annuel</li>
            <li>• Ajustez votre planning de travail réaliste</li>
            <li>• La simulation calcule le TJM nécessaire</li>
            <li>• Visualisez l'impact des congés sur vos revenus</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}