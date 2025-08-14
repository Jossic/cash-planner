import React, { useState } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Receipt, 
  DollarSign,
  Check,
  X,
  Filter,
  Tag,
  FileText,
  Building
} from 'lucide-react'
import { useAppStore, useCurrentPeriod } from '../../stores/useAppStore'
import { 
  formatEuros, 
  formatDate, 
  parseEuros,
  calculateTTC,
  getTodayString,
  validateRequired,
  validateEuros,
  validateDate
} from '../../lib/utils'
import type { Expense, ExpenseFormData } from '../../types'

const EXPENSE_CATEGORIES = [
  { id: 'office', label: 'Matériel de bureau' },
  { id: 'software', label: 'Logiciels' },
  { id: 'travel', label: 'Déplacements' },
  { id: 'meals', label: 'Repas' },
  { id: 'training', label: 'Formation' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'phone', label: 'Téléphone/Internet' },
  { id: 'rent', label: 'Loyer/Local' },
  { id: 'insurance', label: 'Assurances' },
  { id: 'accounting', label: 'Comptabilité' },
  { id: 'other', label: 'Autres' }
]

interface ExpenseFormProps {
  expense?: Expense | null
  onSave: (expense: Omit<Expense, 'id' | 'created_at'>) => void
  onCancel: () => void
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, onSave, onCancel }) => {
  const currentPeriod = useCurrentPeriod()
  const { settings } = useAppStore()
  
  const [formData, setFormData] = useState<ExpenseFormData>(() => {
    if (expense) {
      return {
        label: expense.label,
        category: expense.category || '',
        supplier: expense.supplier || '',
        amount_ht: (expense.amount_ht_cents / 100).toString(),
        tva_rate: expense.tva_rate.toString(),
        expense_date: expense.expense_date,
        payment_date: expense.payment_date || '',
        is_deductible: expense.is_deductible,
        is_service: expense.is_service
      }
    } else {
      return {
        label: '',
        category: '',
        supplier: '',
        amount_ht: '',
        tva_rate: settings.default_tva_rate.toString(),
        expense_date: getTodayString(),
        payment_date: '',
        is_deductible: true,
        is_service: true
      }
    }
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ExpenseFormData, string>> = {}

    if (!validateRequired(formData.label)) {
      newErrors.label = 'Le libellé est requis'
    }

    if (!validateEuros(formData.amount_ht)) {
      newErrors.amount_ht = 'Montant invalide'
    }

    if (!validateDate(formData.expense_date)) {
      newErrors.expense_date = 'Date invalide'
    }

    if (formData.payment_date && !validateDate(formData.payment_date)) {
      newErrors.payment_date = 'Date invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    const amountHTCents = parseEuros(formData.amount_ht)
    const vatRate = parseFloat(formData.tva_rate)
    const amountTTCCents = calculateTTC(amountHTCents, vatRate)

    const expenseData: Omit<Expense, 'id' | 'created_at'> = {
      label: formData.label,
      category: formData.category || undefined,
      supplier: formData.supplier || undefined,
      amount_ht_cents: amountHTCents,
      tva_rate: vatRate,
      amount_ttc_cents: amountTTCCents,
      expense_date: formData.expense_date,
      payment_date: formData.payment_date || undefined,
      is_deductible: formData.is_deductible,
      is_service: formData.is_service,
      receipt_path: expense?.receipt_path
    }

    onSave(expenseData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {expense ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Libellé */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Libellé *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                  errors.label ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Description de la dépense"
              />
              {errors.label && <p className="text-red-500 text-sm mt-1">{errors.label}</p>}
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catégorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Sélectionner une catégorie</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Fournisseur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fournisseur
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Nom du fournisseur"
              />
            </div>

            {/* Montant HT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant HT (€) *
              </label>
              <input
                type="text"
                value={formData.amount_ht}
                onChange={(e) => setFormData({ ...formData, amount_ht: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                  errors.amount_ht ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0,00"
              />
              {errors.amount_ht && <p className="text-red-500 text-sm mt-1">{errors.amount_ht}</p>}
            </div>

            {/* TVA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taux TVA (%)
              </label>
              <select
                value={formData.tva_rate}
                onChange={(e) => setFormData({ ...formData, tva_rate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="0">0%</option>
                <option value="5.5">5,5%</option>
                <option value="10">10%</option>
                <option value="20">20%</option>
              </select>
            </div>

            {/* Date dépense */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de dépense *
              </label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                  errors.expense_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.expense_date && <p className="text-red-500 text-sm mt-1">{errors.expense_date}</p>}
            </div>

            {/* Date paiement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de paiement
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                  errors.payment_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.payment_date && <p className="text-red-500 text-sm mt-1">{errors.payment_date}</p>}
            </div>

            {/* TVA déductible */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_deductible}
                  onChange={(e) => setFormData({ ...formData, is_deductible: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  TVA déductible
                </span>
              </label>
            </div>
          </div>

          {/* Preview */}
          {formData.amount_ht && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Aperçu</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">HT:</span>
                  <span className="ml-2 font-medium">{formatEuros(parseEuros(formData.amount_ht))}</span>
                </div>
                <div>
                  <span className="text-gray-500">TVA:</span>
                  <span className="ml-2 font-medium">
                    {formatEuros(parseEuros(formData.amount_ht) * parseFloat(formData.tva_rate) / 100)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">TTC:</span>
                  <span className="ml-2 font-medium">
                    {formatEuros(calculateTTC(parseEuros(formData.amount_ht), parseFloat(formData.tva_rate)))}
                  </span>
                </div>
              </div>
              {formData.is_deductible && parseFloat(formData.tva_rate) > 0 && (
                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                  ✓ TVA déductible: {formatEuros(parseEuros(formData.amount_ht) * parseFloat(formData.tva_rate) / 100)}
                </div>
              )}
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {expense ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const ExpensesPage: React.FC = () => {
  const currentPeriod = useCurrentPeriod()
  const { getExpensesForPeriod, addExpense, updateExpense, deleteExpense } = useAppStore()
  
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Update expenses when period changes
  React.useEffect(() => {
    setExpenses(getExpensesForPeriod(currentPeriod.key))
  }, [currentPeriod.key, getExpensesForPeriod])

  const handleSaveExpense = (expenseData: Omit<Expense, 'id' | 'created_at'>) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData)
    } else {
      addExpense({
        ...expenseData,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      })
    }
    
    setShowForm(false)
    setEditingExpense(null)
    // Refresh local state
    setExpenses(getExpensesForPeriod(currentPeriod.key))
  }

  const handleDeleteExpense = (expense: Expense) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la dépense "${expense.label}" ?`)) {
      deleteExpense(expense.id)
      setExpenses(getExpensesForPeriod(currentPeriod.key))
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    if (categoryFilter === 'all') return true
    return expense.category === categoryFilter
  })

  // Calculate totals
  const totals = {
    count: filteredExpenses.length,
    totalHT: filteredExpenses.reduce((sum, exp) => sum + exp.amount_ht_cents, 0),
    totalTTC: filteredExpenses.reduce((sum, exp) => sum + exp.amount_ttc_cents, 0),
    deductibleVAT: filteredExpenses
      .filter(exp => exp.is_deductible)
      .reduce((sum, exp) => sum + (exp.amount_ht_cents * exp.tva_rate / 100), 0)
  }

  const getCategoryLabel = (categoryId: string): string => {
    const category = EXPENSE_CATEGORIES.find(cat => cat.id === categoryId)
    return category?.label || categoryId
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dépenses
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentPeriod.label} • {totals.count} dépense{totals.count > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouvelle dépense
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total HT</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatEuros(totals.totalHT)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total TTC</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatEuros(totals.totalTTC)}
              </p>
            </div>
            <Receipt className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">TVA déductible</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatEuros(totals.deductibleVAT)}
              </p>
            </div>
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Catégories</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {new Set(expenses.filter(e => e.category).map(e => e.category)).size}
              </p>
            </div>
            <Tag className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Catégorie:</span>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="all">Toutes</option>
          {EXPENSE_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Aucune dépense
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Commencez par ajouter votre première dépense pour {currentPeriod.label}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer une dépense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Libellé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Montant HT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    TVA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Déductible
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {expense.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {expense.category ? getCategoryLabel(expense.category) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {expense.supplier || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatEuros(expense.amount_ht_cents)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {expense.tva_rate}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(expense.expense_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        expense.is_deductible 
                          ? 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                          : 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {expense.is_deductible ? 'Oui' : 'Non'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingExpense(expense)
                            setShowForm(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          onSave={handleSaveExpense}
          onCancel={() => {
            setShowForm(false)
            setEditingExpense(null)
          }}
        />
      )}
    </div>
  )
}