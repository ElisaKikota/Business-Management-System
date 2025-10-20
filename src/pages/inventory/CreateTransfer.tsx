import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useInventory } from '../../contexts/InventoryContext'

const CreateTransfer = () => {
  const { products, stores, stockItems, createTransfer } = useInventory()
  const navigate = useNavigate()

  const [fromStoreId, setFromStoreId] = useState('')
  const [toStoreId, setToStoreId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fromStock = useMemo(() => {
    if (!fromStoreId || !productId) return 0
    const item = stockItems.find(s => s.storeId === fromStoreId && s.productId === productId)
    return item?.availableStock ?? item?.currentStock ?? 0
  }, [stockItems, fromStoreId, productId])

  const canSubmit = fromStoreId && toStoreId && productId && quantity && fromStoreId !== toStoreId && Number(quantity) > 0 && Number(quantity) <= fromStock

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      await createTransfer({
        fromStoreId,
        toStoreId,
        productId,
        quantity: Number(quantity),
        status: 'pending',
        requestedBy: 'system',
        requestedAt: new Date().toISOString(),
        notes
      })
      navigate('/app/inventory/transfers')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/app/inventory/transfers" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Transfer</h1>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Store</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={fromStoreId} onChange={(e) => setFromStoreId(e.target.value)}>
              <option value="">Select store</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Store</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={toStoreId} onChange={(e) => setToStoreId(e.target.value)}>
              <option value="">Select store</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} />
            {fromStoreId && productId && (
              <p className="text-xs text-gray-500 mt-1">Available in from-store: {fromStock}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end">
          <button onClick={handleSubmit} disabled={!canSubmit || saving} className="inline-flex items-center px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Creating...' : 'Create Transfer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateTransfer






