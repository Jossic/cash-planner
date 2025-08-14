import React, { useState } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  FileText, 
  DollarSign,
  Check,
  X,
  Filter
} from 'lucide-react'
import { useAppStore, useCurrentPeriod } from '../../stores/useAppStore'
import { 
  formatEuros, 
  formatDate, 
  getStatusColor, 
  getStatusLabel,
  parseEuros,
  eurosToRents,
  calculateTTC,
  getTodayString,
  validateRequired,
  validateEuros,
  validateDate
} from '../../lib/utils'
import type { Invoice, InvoiceFormData } from '../../types'

interface InvoiceFormProps {
  invoice?: Invoice | null
  onSave: (invoice: Omit<Invoice, 'id' | 'created_at'>) => void
  onCancel: () => void
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onSave, onCancel }) => {
  const currentPeriod = useCurrentPeriod()
  const { settings } = useAppStore()
  
  const [formData, setFormData] = useState<InvoiceFormData>(() => {
    if (invoice) {
      return {
        client: invoice.client,
        description: invoice.description || '',
        amount_ht: (invoice.amount_ht_cents / 100).toString(),
        tva_rate: invoice.tva_rate.toString(),
        issued_date: invoice.issued_date,
        payment_date: invoice.payment_date || '',
        due_date: invoice.due_date || '',
        is_service: invoice.is_service,
        delivery_date: invoice.delivery_date || ''
      }
    } else {
      return {
        client: '',
        description: '',
        amount_ht: '',
        tva_rate: settings.default_tva_rate.toString(),
        issued_date: getTodayString(),
        payment_date: '',
        due_date: '',
        is_service: true,
        delivery_date: ''
      }
    }
  })

  const [errors, setErrors] = useState<Partial<Record<keyof InvoiceFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof InvoiceFormData, string>> = {}

    if (!validateRequired(formData.client)) {
      newErrors.client = 'Le client est requis'
    }

    if (!validateEuros(formData.amount_ht)) {
      newErrors.amount_ht = 'Montant invalide'
    }

    if (!validateDate(formData.issued_date)) {
      newErrors.issued_date = 'Date invalide'
    }

    if (formData.payment_date && !validateDate(formData.payment_date)) {
      newErrors.payment_date = 'Date invalide'
    }

    if (formData.due_date && !validateDate(formData.due_date)) {
      newErrors.due_date = 'Date invalide'
    }

    // Validation spécifique pour les biens
    if (!formData.is_service && !formData.delivery_date) {
      newErrors.delivery_date = 'Date de livraison requise pour les biens'
    }

    if (formData.delivery_date && !validateDate(formData.delivery_date)) {
      newErrors.delivery_date = 'Date invalide'
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

    // Determine status based on payment date
    let status: Invoice['status'] = 'draft'
    if (formData.payment_date) {
      status = 'paid'
    } else if (formData.due_date && new Date(formData.due_date) < new Date()) {
      status = 'overdue'
    } else if (formData.issued_date) {
      status = 'sent'
    }

    const invoiceData: Omit<Invoice, 'id' | 'created_at'> = {
      client: formData.client,
      description: formData.description || undefined,
      amount_ht_cents: amountHTCents,
      tva_rate: vatRate,
      amount_ttc_cents: amountTTCCents,
      issued_date: formData.issued_date,
      payment_date: formData.payment_date || undefined,
      due_date: formData.due_date || undefined,
      status,
      number: invoice?.number,
      is_service: formData.is_service,
      delivery_date: formData.delivery_date || undefined
    }

    onSave(invoiceData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {invoice ? 'Modifier la facture' : 'Nouvelle facture'}
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
            {/* Client */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client *
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                  errors.client ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Nom du client"
              />
              {errors.client && <p className="text-red-500 text-sm mt-1">{errors.client}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Description de la prestation"
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

            {/* Date émission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date d'émission *
              </label>
              <input
                type="date"
                value={formData.issued_date}
                onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                  errors.issued_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.issued_date && <p className="text-red-500 text-sm mt-1">{errors.issued_date}</p>}
            </div>

            {/* Date d'échéance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date d'échéance
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                  errors.due_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.due_date && <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>}
            </div>

            {/* Type de vente */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.is_service}
                  onChange={(e) => setFormData({ ...formData, is_service: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prestation de service
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.is_service 
                      ? 'TVA calculée sur la date d\'encaissement' 
                      : 'TVA calculée sur la date de livraison/facturation'
                    }
                  </div>
                </div>
              </label>
            </div>

            {/* Date de livraison (pour les biens) */}
            {!formData.is_service && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de livraison *
                  <span className="text-sm text-gray-500 ml-2">(pour TVA biens)</span>
                </label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                    errors.delivery_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.delivery_date && <p className="text-red-500 text-sm mt-1">{errors.delivery_date}</p>}
              </div>
            )}

            {/* Date encaissement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date d'encaissement
                <span className="text-sm text-gray-500 ml-2">
                  {formData.is_service ? '(pour TVA prestations)' : '(optionnel)'}
                </span>
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
          </div>

          {/* Preview */}
          {formData.amount_ht && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Aperçu</h4>
              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
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
              <div className="text-xs text-blue-600 dark:text-blue-400">
                📋 {formData.is_service ? 'Prestation' : 'Bien'} • TVA calculée sur {formData.is_service ? 'l\'encaissement' : 'la livraison'}
              </div>
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
            {invoice ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const InvoicesPage: React.FC = () => {
  const currentPeriod = useCurrentPeriod()
  const { getInvoicesForPeriod, addInvoice, updateInvoice, deleteInvoice } = useAppStore()
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Update invoices when period changes
  React.useEffect(() => {
    setInvoices(getInvoicesForPeriod(currentPeriod.key))
  }, [currentPeriod.key, getInvoicesForPeriod])

  const handleSaveInvoice = (invoiceData: Omit<Invoice, 'id' | 'created_at'>) => {
    if (editingInvoice) {
      updateInvoice(editingInvoice.id, invoiceData)
    } else {
      addInvoice({
        ...invoiceData,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      })
    }
    
    setShowForm(false)
    setEditingInvoice(null)
    // Refresh local state
    setInvoices(getInvoicesForPeriod(currentPeriod.key))
  }

  const handleDeleteInvoice = (invoice: Invoice) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la facture de ${invoice.client} ?`)) {
      deleteInvoice(invoice.id)
      setInvoices(getInvoicesForPeriod(currentPeriod.key))
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    if (statusFilter === 'all') return true
    return invoice.status === statusFilter
  })

  // Calculate totals
  const totals = {
    count: filteredInvoices.length,
    totalHT: filteredInvoices.reduce((sum, inv) => sum + inv.amount_ht_cents, 0),
    totalTTC: filteredInvoices.reduce((sum, inv) => sum + inv.amount_ttc_cents, 0),
    paid: filteredInvoices.filter(inv => inv.status === 'paid').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Encaissements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentPeriod.label} • {totals.count} facture{totals.count > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouvelle facture
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
            <DollarSign className="h-8 w-8 text-blue-600" />
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
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Payées</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {totals.paid}
              </p>
            </div>
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {totals.count - totals.paid}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="all">Toutes</option>
          <option value="draft">Brouillons</option>
          <option value="sent">Envoyées</option>
          <option value="paid">Payées</option>
          <option value="overdue">En retard</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Aucune facture
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Commencez par créer votre première facture pour {currentPeriod.label}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer une facture
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Montant HT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    TVA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date émission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Encaissement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {invoice.client}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {invoice.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatEuros(invoice.amount_ht_cents)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {invoice.tva_rate}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(invoice.issued_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {invoice.payment_date ? formatDate(invoice.payment_date) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingInvoice(invoice)
                            setShowForm(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice)}
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

      {/* Invoice Form Modal */}
      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onSave={handleSaveInvoice}
          onCancel={() => {
            setShowForm(false)
            setEditingInvoice(null)
          }}
        />
      )}
    </div>
  )
}