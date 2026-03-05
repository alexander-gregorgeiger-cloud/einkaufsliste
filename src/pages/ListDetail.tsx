import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc,
  Timestamp, getDoc, setDoc, increment,
} from 'firebase/firestore'
import { firestore } from '../firebase'
import { useAuth } from '../AuthContext'
import { ArrowLeft, Plus, Trash2, Zap, X, ChevronUp, ChevronDown } from 'lucide-react'
import type { ShoppingList, ShoppingItem, ItemStat } from '../types'

export default function ListDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [list, setList] = useState<ShoppingList | null>(null)
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [itemName, setItemName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showTopItems, setShowTopItems] = useState(false)
  const [topItems, setTopItems] = useState<ItemStat[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen to list and items
  useEffect(() => {
    if (!user || !id) return
    const listRef = doc(firestore, 'grocery_users', user.uid, 'lists', id)
    const unsubList = onSnapshot(listRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setList({
          id: snap.id,
          name: data.name,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      }
      setLoading(false)
    })

    const itemsQuery = query(
      collection(firestore, 'grocery_users', user.uid, 'lists', id, 'items'),
      orderBy('sortOrder', 'asc')
    )
    const unsubItems = onSnapshot(itemsQuery, (snap) => {
      const data: ShoppingItem[] = snap.docs.map(d => {
        const item = d.data()
        return {
          id: d.id,
          listId: id,
          name: item.name,
          checked: item.checked || false,
          sortOrder: item.sortOrder ?? item.createdAt?.toMillis?.() ?? Date.now(),
          createdAt: item.createdAt?.toDate() || new Date(),
        }
      })
      setItems(data)
    })

    return () => { unsubList(); unsubItems() }
  }, [user, id])

  // Load top items
  useEffect(() => {
    if (!user) return
    const statsRef = collection(firestore, 'grocery_users', user.uid, 'itemStats')
    const q = query(statsRef, orderBy('count', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const stats: ItemStat[] = snap.docs.slice(0, 20).map(d => ({
        name: d.id,
        count: d.data().count || 0,
      }))
      setTopItems(stats)
    })
    return unsub
  }, [user])

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-6 text-center text-slate-400">Laden...</div>
  }

  if (!list) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-primary mb-4">
          <ArrowLeft className="w-5 h-5" /> Zurück
        </button>
        <p className="text-slate-400 text-center py-12">Liste nicht gefunden</p>
      </div>
    )
  }

  async function addItem(name: string) {
    if (!name.trim() || !id || !user) return
    const trimmed = name.trim()
    if (items.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) return

    // New items get the highest sortOrder + 1
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sortOrder)) : 0
    await addDoc(collection(firestore, 'grocery_users', user.uid, 'lists', id, 'items'), {
      name: trimmed,
      checked: false,
      sortOrder: maxOrder + 1,
      createdAt: Timestamp.now(),
    })
    await updateDoc(doc(firestore, 'grocery_users', user.uid, 'lists', id), { updatedAt: Timestamp.now() })

    const statRef = doc(firestore, 'grocery_users', user.uid, 'itemStats', trimmed.toLowerCase())
    const statSnap = await getDoc(statRef)
    if (statSnap.exists()) {
      await updateDoc(statRef, { count: increment(1) })
    } else {
      await setDoc(statRef, { count: 1 })
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    await addItem(itemName)
    setItemName('')
    inputRef.current?.focus()
  }

  async function toggleItem(item: ShoppingItem) {
    if (!user || !id) return
    await updateDoc(doc(firestore, 'grocery_users', user.uid, 'lists', id, 'items', item.id), {
      checked: !item.checked,
    })
  }

  async function deleteItem(itemId: string) {
    if (!user || !id) return
    await deleteDoc(doc(firestore, 'grocery_users', user.uid, 'lists', id, 'items', itemId))
    await updateDoc(doc(firestore, 'grocery_users', user.uid, 'lists', id), { updatedAt: Timestamp.now() })
  }

  async function moveItem(item: ShoppingItem, direction: 'up' | 'down') {
    if (!user || !id) return
    const unchecked = items.filter(i => !i.checked).sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = unchecked.findIndex(i => i.id === item.id)
    if (idx < 0) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= unchecked.length) return

    const other = unchecked[swapIdx]
    // Swap sortOrder values
    await updateDoc(doc(firestore, 'grocery_users', user.uid, 'lists', id, 'items', item.id), {
      sortOrder: other.sortOrder,
    })
    await updateDoc(doc(firestore, 'grocery_users', user.uid, 'lists', id, 'items', other.id), {
      sortOrder: item.sortOrder,
    })
  }

  async function clearChecked() {
    if (!user || !id || !confirm('Alle erledigten Artikel entfernen?')) return
    const checked = items.filter(i => i.checked)
    for (const item of checked) {
      await deleteDoc(doc(firestore, 'grocery_users', user.uid, 'lists', id, 'items', item.id))
    }
    await updateDoc(doc(firestore, 'grocery_users', user.uid, 'lists', id), { updatedAt: Timestamp.now() })
  }

  async function addTopItem(name: string) {
    await addItem(name)
  }

  const uncheckedItems = items.filter(i => !i.checked).sort((a, b) => a.sortOrder - b.sortOrder)
  const checkedItems = items.filter(i => i.checked)
  const currentItemNames = items.map(i => i.name.toLowerCase())
  const availableTopItems = topItems.filter(t => !currentItemNames.includes(t.name))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-primary font-medium hover:text-primary-dark transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Listen</span>
        </button>
        <div className="flex gap-2">
          {topItems.length > 0 && (
            <button
              onClick={() => setShowTopItems(!showTopItems)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                showTopItems
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Top 20</span>
            </button>
          )}
          {checkedItems.length > 0 && (
            <button
              onClick={clearChecked}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Erledigt löschen</span>
            </button>
          )}
        </div>
      </div>

      {/* List Info */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">{list.name}</h1>
        <p className="text-xs text-slate-400 mt-1">
          {items.length} Artikel &middot; {checkedItems.length} erledigt
        </p>
      </div>

      {/* Quick Add Top 10 */}
      {showTopItems && availableTopItems.length > 0 && (
        <div className="mb-4 bg-amber-50 rounded-2xl p-3 border border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-800">Häufig gekauft</span>
            <button onClick={() => setShowTopItems(false)} className="p-1 text-amber-400 hover:text-amber-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTopItems.map(item => (
              <button
                key={item.name}
                onClick={() => addTopItem(item.name)}
                className="px-3 py-1.5 bg-white text-sm text-slate-700 rounded-full border border-amber-200 hover:bg-amber-100 hover:border-amber-300 active:scale-95 transition-all capitalize"
              >
                + {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="mb-6">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            placeholder="Artikel hinzufügen..."
            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
          />
          <button
            type="submit"
            disabled={!itemName.trim()}
            className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-dark active:scale-95 transition-all shadow-sm disabled:opacity-30"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Unchecked Items */}
      {uncheckedItems.length === 0 && checkedItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">Noch keine Artikel. Füge welche hinzu!</p>
        </div>
      ) : (
        <>
          {uncheckedItems.length > 0 && (
            <div className="space-y-1 mb-4">
              {uncheckedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 bg-white rounded-xl px-3 py-3 shadow-sm border border-slate-200 active:scale-[0.99] transition-all"
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col -my-1">
                    <button
                      onClick={() => moveItem(item, 'up')}
                      disabled={idx === 0}
                      className="p-0.5 text-slate-300 hover:text-primary disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(item, 'down')}
                      disabled={idx === uncheckedItems.length - 1}
                      className="p-0.5 text-slate-300 hover:text-primary disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => toggleItem(item)}
                    className="w-6 h-6 rounded-full border-2 border-slate-300 hover:border-primary flex-shrink-0 transition-colors"
                  />
                  <span className="flex-1 text-slate-800 text-base">{item.name}</span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Checked Items */}
          {checkedItems.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2 px-1">
                Erledigt ({checkedItems.length})
              </p>
              <div className="space-y-1">
                {checkedItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
                  >
                    <button
                      onClick={() => toggleItem(item)}
                      className="w-6 h-6 rounded-full bg-primary border-2 border-primary flex-shrink-0 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <span className="flex-1 text-slate-400 text-base line-through">{item.name}</span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 text-slate-200 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
