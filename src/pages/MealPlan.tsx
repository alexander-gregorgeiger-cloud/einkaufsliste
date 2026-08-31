import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, getDocs, Timestamp, writeBatch,
} from 'firebase/firestore'
import { firestore } from '../firebase'
import { useAuth } from '../AuthContext'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, X, ShoppingBasket,
  ChefHat, CalendarDays, Check, ListChecks,
} from 'lucide-react'
import type { Meal, MealSlot, ShoppingList } from '../types'
import recipes from '../recipes'

const SLOTS: { key: MealSlot; label: string }[] = [
  { key: 'mittag', label: 'Mittag' },
  { key: 'abend', label: 'Abend' },
]

const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

export default function MealPlan() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [meals, setMeals] = useState<Meal[]>([])
  const [error, setError] = useState('')

  // Slot currently showing the inline "new meal" input
  const [adding, setAdding] = useState<{ date: string; slot: MealSlot } | null>(null)
  const [newName, setNewName] = useState('')

  const [openMealId, setOpenMealId] = useState<string | null>(null)
  const [shopSource, setShopSource] = useState<'week' | string | null>(null)
  const [recentLists, setRecentLists] = useState<ShoppingList[]>([])

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = days[6]
  const todayISO = toISO(new Date())

  useEffect(() => {
    if (!user) return
    // date is a sortable YYYY-MM-DD string, so a range on one field is enough —
    // this needs no composite index.
    const q = query(
      collection(firestore, 'grocery_users', user.uid, 'meals'),
      where('date', '>=', toISO(weekStart)),
      where('date', '<=', toISO(weekEnd)),
    )
    const unsub = onSnapshot(q, (snap) => {
      setMeals(snap.docs.map(d => {
        const m = d.data()
        return {
          id: d.id,
          date: m.date,
          slot: m.slot,
          name: m.name,
          ingredients: m.ingredients || [],
        }
      }))
    }, (err) => {
      console.error('Firestore error:', err)
      setError(err.message)
    })
    return unsub
  }, [user, weekStart])

  // Shopping lists touched in the last 5 days — offered as targets to append to.
  // Range + orderBy on the same field needs no composite index.
  useEffect(() => {
    if (!user) return
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 5)
    const q = query(
      collection(firestore, 'grocery_users', user.uid, 'lists'),
      where('updatedAt', '>=', Timestamp.fromDate(cutoff)),
      orderBy('updatedAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setRecentLists(snap.docs.map(d => {
        const l = d.data()
        return {
          id: d.id,
          name: l.name,
          createdAt: l.createdAt?.toDate() || new Date(),
          updatedAt: l.updatedAt?.toDate() || new Date(),
        }
      }))
    }, (err) => console.error('Firestore error:', err))
    return unsub
  }, [user])

  const openMeal = meals.find(m => m.id === openMealId) || null

  function mealAt(date: string, slot: MealSlot) {
    return meals.find(m => m.date === date && m.slot === slot) || null
  }

  async function createMeal(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !adding || !newName.trim()) return
    const name = newName.trim()
    // Pre-fill ingredients when the name matches one of the built-in recipes.
    const recipe = recipes.find(r => r.name.toLowerCase() === name.toLowerCase())
    const ref = await addDoc(collection(firestore, 'grocery_users', user.uid, 'meals'), {
      date: adding.date,
      slot: adding.slot,
      name,
      ingredients: recipe ? recipe.ingredients : [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    setNewName('')
    setAdding(null)
    setOpenMealId(ref.id)
  }

  async function saveMeal(id: string, data: Partial<Meal>) {
    if (!user) return
    await updateDoc(doc(firestore, 'grocery_users', user.uid, 'meals', id), {
      ...data,
      updatedAt: Timestamp.now(),
    })
  }

  async function removeMeal(id: string) {
    if (!user || !confirm('Dieses Menü löschen?')) return
    await deleteDoc(doc(firestore, 'grocery_users', user.uid, 'meals', id))
    setOpenMealId(null)
  }

  // Collects the ingredients that feed the shopping-list dialog.
  const shopEntries: { name: string; from: string }[] = (() => {
    if (!shopSource) return []
    const source = shopSource === 'week'
      ? [...meals].sort((a, b) => a.date.localeCompare(b.date))
      : meals.filter(m => m.id === shopSource)
    const seen = new Set<string>()
    const out: { name: string; from: string }[] = []
    for (const m of source) {
      for (const ing of m.ingredients) {
        const key = ing.trim().toLowerCase()
        if (!key || seen.has(key)) continue
        seen.add(key)
        out.push({ name: ing.trim(), from: m.name })
      }
    }
    return out
  })()

  const shopDefaultName = shopSource === 'week'
    ? `Wocheneinkauf ${formatShort(weekStart)}–${formatShort(weekEnd)}`
    : meals.find(m => m.id === shopSource)?.name || 'Einkauf'

  /** `target` is either 'new' or the id of an existing list to append to. */
  async function saveToList(target: string, listName: string, names: string[]) {
    if (!user || names.length === 0) return
    const now = Timestamp.now()
    const batch = writeBatch(firestore)
    const listsRef = collection(firestore, 'grocery_users', user.uid, 'lists')
    let listId: string

    if (target === 'new') {
      const listRef = doc(listsRef)
      listId = listRef.id
      batch.set(listRef, { name: listName, createdAt: now, updatedAt: now })
      names.forEach((name, i) => {
        batch.set(doc(collection(listsRef, listId, 'items')), {
          name, checked: false, sortOrder: i + 1, createdAt: now,
        })
      })
    } else {
      listId = target
      const itemsRef = collection(listsRef, listId, 'items')
      const existing = await getDocs(itemsRef)
      // Skip ingredients already on the list, and append after the last item.
      const known = new Set(existing.docs.map(d => String(d.data().name || '').trim().toLowerCase()))
      let order = existing.docs.reduce((max, d) => Math.max(max, d.data().sortOrder ?? 0), 0)
      for (const name of names) {
        if (known.has(name.toLowerCase())) continue
        batch.set(doc(itemsRef), { name, checked: false, sortOrder: ++order, createdAt: now })
      }
      batch.update(doc(listsRef, listId), { updatedAt: now })
    }

    await batch.commit()
    setShopSource(null)
    navigate(`/list/${listId}`)
  }

  const plannedCount = meals.filter(m => m.ingredients.length > 0).length

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-primary font-medium hover:text-primary-dark transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Listen</span>
        </button>
        <div className="flex items-center gap-2 text-slate-900">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Wochenplan</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 border border-red-200">
          {error}
        </div>
      )}

      {/* Week switcher */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-2 py-2 mb-4 shadow-sm border border-slate-200">
        <button
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors"
          aria-label="Vorherige Woche"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setWeekStart(startOfWeek(new Date()))}
          className="flex-1 text-center"
        >
          <span className="block font-semibold text-slate-900">
            {formatShort(weekStart)} – {formatShort(weekEnd)}
          </span>
          <span className="block text-xs text-slate-400">Tippen für aktuelle Woche</span>
        </button>
        <button
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors"
          aria-label="Nächste Woche"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Days */}
      <div className="space-y-2.5">
        {days.map((day, i) => {
          const iso = toISO(day)
          const isToday = iso === todayISO
          return (
            <div
              key={iso}
              className={`bg-white rounded-2xl p-3 shadow-sm border ${
                isToday ? 'border-primary ring-1 ring-primary/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-baseline gap-2 mb-2 px-1">
                <h2 className={`font-semibold ${isToday ? 'text-primary' : 'text-slate-900'}`}>
                  {DAY_NAMES[i]}
                </h2>
                <span className="text-sm text-slate-400">{formatShort(day)}</span>
                {isToday && <span className="text-xs text-primary font-medium">heute</span>}
              </div>

              <div className="space-y-1.5">
                {SLOTS.map(slot => {
                  const meal = mealAt(iso, slot.key)
                  const isAdding = adding?.date === iso && adding.slot === slot.key

                  if (meal) {
                    return (
                      <button
                        key={slot.key}
                        onClick={() => setOpenMealId(meal.id)}
                        className="w-full flex items-center gap-3 text-left bg-slate-50 hover:bg-slate-100 rounded-xl px-3 py-2.5 transition-colors active:scale-[0.99]"
                      >
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide w-14 flex-shrink-0">
                          {slot.label}
                        </span>
                        <span className="flex-1 min-w-0 text-slate-900 font-medium truncate">
                          {meal.name}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {meal.ingredients.length > 0
                            ? `${meal.ingredients.length} Zutaten`
                            : 'keine Zutaten'}
                        </span>
                      </button>
                    )
                  }

                  if (isAdding) {
                    return (
                      <form key={slot.key} onSubmit={createMeal} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide w-14 flex-shrink-0 pl-3">
                          {slot.label}
                        </span>
                        <input
                          autoFocus
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          onBlur={() => { if (!newName.trim()) setAdding(null) }}
                          placeholder="z.B. Chicken Caesar Salad"
                          className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                          type="submit"
                          disabled={!newName.trim()}
                          className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-30"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </form>
                    )
                  }

                  return (
                    <button
                      key={slot.key}
                      onClick={() => { setAdding({ date: iso, slot: slot.key }); setNewName('') }}
                      className="w-full flex items-center gap-3 text-left border border-dashed border-slate-200 hover:border-primary hover:bg-slate-50 rounded-xl px-3 py-2.5 transition-colors"
                    >
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide w-14 flex-shrink-0">
                        {slot.label}
                      </span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Menü</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Week shopping list */}
      {plannedCount > 0 && (
        <button
          onClick={() => setShopSource('week')}
          className="w-full mt-5 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-dark active:scale-[0.98] transition-all shadow-sm"
        >
          <ShoppingBasket className="w-5 h-5" />
          Einkaufsliste für die Woche
        </button>
      )}

      {openMeal && (
        <MealDetail
          meal={openMeal}
          onClose={() => setOpenMealId(null)}
          onSave={data => saveMeal(openMeal.id, data)}
          onDelete={() => removeMeal(openMeal.id)}
          onShop={() => { setOpenMealId(null); setShopSource(openMeal.id) }}
        />
      )}

      {shopSource && (
        <ShopDialog
          entries={shopEntries}
          defaultName={shopDefaultName}
          grouped={shopSource === 'week'}
          lists={recentLists}
          onClose={() => setShopSource(null)}
          onSave={saveToList}
        />
      )}
    </div>
  )
}

function MealDetail({ meal, onClose, onSave, onDelete, onShop }: {
  meal: Meal
  onClose: () => void
  onSave: (data: Partial<Meal>) => Promise<void>
  onDelete: () => void
  onShop: () => void
}) {
  const [name, setName] = useState(meal.name)
  const [ingredient, setIngredient] = useState('')

  const recipe = recipes.find(r => r.name.toLowerCase() === meal.name.toLowerCase())
  const canImport = recipe && meal.ingredients.length === 0

  async function addIngredient(e: React.FormEvent) {
    e.preventDefault()
    const value = ingredient.trim()
    if (!value) return
    if (meal.ingredients.some(i => i.toLowerCase() === value.toLowerCase())) {
      setIngredient('')
      return
    }
    await onSave({ ingredients: [...meal.ingredients, value] })
    setIngredient('')
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-200 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <button
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl transition-colors flex-shrink-0"
          aria-label="Schliessen"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="flex-1 font-semibold text-slate-900">Menü</span>
        <button
          onClick={onDelete}
          className="w-11 h-11 flex items-center justify-center text-slate-300 hover:text-red-500 rounded-xl transition-colors flex-shrink-0"
          aria-label="Menü löschen"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => {
            const trimmed = name.trim()
            if (trimmed && trimmed !== meal.name) onSave({ name: trimmed })
            else if (!trimmed) setName(meal.name)
          }}
          className="w-full text-2xl font-bold text-slate-900 px-3 py-2 rounded-xl border border-transparent hover:border-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 mb-5"
        />

        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-1">
          Zutaten ({meal.ingredients.length})
        </p>

        {canImport && (
          <button
            onClick={() => onSave({ ingredients: recipe.ingredients })}
            className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 py-2.5 rounded-xl font-medium hover:bg-emerald-100 transition-colors mb-3"
          >
            <ChefHat className="w-4 h-4" />
            Zutaten aus Rezept übernehmen
          </button>
        )}

        <div className="space-y-1.5 mb-3">
          {meal.ingredients.map(ing => (
            <div
              key={ing}
              className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-slate-200"
            >
              <span className="flex-1 min-w-0 text-slate-800 truncate">{ing}</span>
              <button
                onClick={() => onSave({ ingredients: meal.ingredients.filter(i => i !== ing) })}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                aria-label={`${ing} entfernen`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {meal.ingredients.length === 0 && !canImport && (
            <p className="text-slate-400 text-center py-6">Noch keine Zutaten.</p>
          )}
        </div>

        <form onSubmit={addIngredient} className="flex gap-2">
          <input
            value={ingredient}
            onChange={e => setIngredient(e.target.value)}
            placeholder="Zutat hinzufügen..."
            className="flex-1 min-w-0 px-4 py-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
          />
          <button
            type="submit"
            disabled={!ingredient.trim()}
            className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-30"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>
      </div>

      {meal.ingredients.length > 0 && (
        <div className="px-3 py-3 border-t border-slate-200 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            onClick={onShop}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            <ShoppingBasket className="w-5 h-5" />
            Einkaufsliste erstellen
          </button>
        </div>
      )}
    </div>
  )
}

function ShopDialog({ entries, defaultName, grouped, lists, onClose, onSave }: {
  entries: { name: string; from: string }[]
  defaultName: string
  grouped: boolean
  lists: ShoppingList[]
  onClose: () => void
  onSave: (target: string, listName: string, names: string[]) => Promise<void>
}) {
  // Everything starts selected; you untick what you already have at home.
  const [selected, setSelected] = useState<string[]>(() => entries.map(e => e.name))
  const [listName, setListName] = useState(defaultName)
  const [target, setTarget] = useState('new')
  const [saving, setSaving] = useState(false)

  function toggle(name: string) {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  async function submit() {
    if (selected.length === 0 || saving) return
    setSaving(true)
    try {
      // Keep the original ingredient order rather than click order.
      await onSave(target, listName.trim() || defaultName, entries.filter(e => selected.includes(e.name)).map(e => e.name))
    } finally {
      setSaving(false)
    }
  }

  const groups = grouped
    ? entries.reduce<Record<string, string[]>>((acc, e) => {
        (acc[e.from] ||= []).push(e.name)
        return acc
      }, {})
    : { '': entries.map(e => e.name) }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-200 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <button
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl transition-colors flex-shrink-0"
          aria-label="Schliessen"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="flex-1 font-semibold text-slate-900">Was fehlt dir?</span>
        <button
          onClick={() => setSelected(selected.length === entries.length ? [] : entries.map(e => e.name))}
          className="text-sm text-primary font-medium px-2 flex-shrink-0"
        >
          {selected.length === entries.length ? 'Keine' : 'Alle'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {lists.length > 0 && (
          <>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-1">
              Wohin?
            </p>
            <div className="space-y-1.5 mb-4">
              <TargetRow
                active={target === 'new'}
                onClick={() => setTarget('new')}
                icon={<Plus className="w-4 h-4" />}
                title="Neue Liste"
              />
              {lists.map(l => (
                <TargetRow
                  key={l.id}
                  active={target === l.id}
                  onClick={() => setTarget(l.id)}
                  icon={<ListChecks className="w-4 h-4" />}
                  title={l.name}
                  subtitle={formatShort(l.updatedAt)}
                />
              ))}
            </div>
          </>
        )}

        {target === 'new' && (
          <input
            value={listName}
            onChange={e => setListName(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm mb-4"
          />
        )}

        <p className="text-sm text-slate-500 mb-3 px-1">
          Abgehakt wird eingekauft. Nimm weg, was du schon hast.
        </p>

        {Object.entries(groups).map(([from, names]) => (
          <div key={from} className="mb-4">
            {from && (
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 px-1">
                {from}
              </p>
            )}
            <div className="space-y-1.5">
              {names.map(name => {
                const on = selected.includes(name)
                return (
                  <button
                    key={name}
                    onClick={() => toggle(name)}
                    className={`w-full flex items-center gap-3 text-left rounded-xl px-3 py-2.5 border transition-colors ${
                      on ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <span className={`w-6 h-6 min-w-[24px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      on ? 'bg-primary border-primary' : 'border-slate-300'
                    }`}>
                      {on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </span>
                    <span className={`flex-1 min-w-0 truncate ${on ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                      {name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-3 border-t border-slate-200 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button
          onClick={submit}
          disabled={selected.length === 0 || saving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-40"
        >
          <ShoppingBasket className="w-5 h-5" />
          {saving
            ? 'Wird gespeichert...'
            : target === 'new'
              ? `${selected.length} Zutaten in neue Liste`
              : `${selected.length} Zutaten hinzufügen`}
        </button>
      </div>
    </div>
  )
}

function TargetRow({ active, onClick, icon, title, subtitle }: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-left rounded-xl px-3 py-2.5 border transition-colors ${
        active ? 'bg-primary/5 border-primary' : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
      }`}>
        {icon}
      </span>
      <span className={`flex-1 min-w-0 truncate font-medium ${active ? 'text-slate-900' : 'text-slate-600'}`}>
        {title}
      </span>
      {subtitle && <span className="text-xs text-slate-400 flex-shrink-0">{subtitle}</span>}
    </button>
  )
}

/** Monday of the week containing `d`. */
function startOfWeek(d: Date): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day))
  return date
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

/** Local YYYY-MM-DD — toISOString() would shift the day in CET. */
function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function formatShort(d: Date): string {
  return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })
}
