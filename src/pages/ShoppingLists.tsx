import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { firestore, auth } from '../firebase'
import { useAuth } from '../AuthContext'
import { Plus, ShoppingCart, Trash2, ShoppingBag, LogOut, ChefHat, Clock, Users, ShoppingBasket, ChevronDown, ChevronUp } from 'lucide-react'
import type { ShoppingList } from '../types'
import { getRecipeOfTheDay } from '../recipes'

export default function ShoppingLists() {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [lists, setLists] = useState<(ShoppingList & { itemCount?: number, checkedCount?: number })[] | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(firestore, 'grocery_users', user.uid, 'lists'),
      orderBy('updatedAt', 'desc')
    )
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data: (ShoppingList & { itemCount?: number, checkedCount?: number })[] = []
      for (const docSnap of snapshot.docs) {
        const d = docSnap.data()
        const itemsSnap = await getDocs(collection(firestore, 'grocery_users', user.uid, 'lists', docSnap.id, 'items'))
        const checked = itemsSnap.docs.filter(i => i.data().checked).length
        data.push({
          id: docSnap.id,
          name: d.name,
          createdAt: d.createdAt?.toDate() || new Date(),
          updatedAt: d.updatedAt?.toDate() || new Date(),
          itemCount: itemsSnap.size,
          checkedCount: checked,
        })
      }
      setLists(data)
    }, (err) => {
      console.error('Firestore error:', err)
      setError(err.message)
      setLists([])
    })
    return unsubscribe
  }, [user])

  async function createList(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !user) return
    setError('')
    try {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(firestore, 'grocery_users', user.uid, 'lists'), {
        name: name.trim(),
        createdAt: now,
        updatedAt: now,
      })
      setName('')
      setShowForm(false)
      navigate(`/list/${docRef.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fehler beim Erstellen'
      setError(message)
    }
  }

  const [recipeExpanded, setRecipeExpanded] = useState(false)
  const [recipeLoading, setRecipeLoading] = useState(false)
  const recipe = getRecipeOfTheDay()

  async function createListFromRecipe() {
    if (!user || recipeLoading) return
    setRecipeLoading(true)
    try {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(firestore, 'grocery_users', user.uid, 'lists'), {
        name: recipe.name,
        createdAt: now,
        updatedAt: now,
      })
      for (let i = 0; i < recipe.ingredients.length; i++) {
        await addDoc(collection(firestore, 'grocery_users', user.uid, 'lists', docRef.id, 'items'), {
          name: recipe.ingredients[i],
          checked: false,
          sortOrder: i + 1,
          createdAt: now,
        })
      }
      navigate(`/list/${docRef.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fehler beim Erstellen'
      setError(message)
    } finally {
      setRecipeLoading(false)
    }
  }

  async function deleteList(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!user || !confirm('Diese Liste und alle Artikel löschen?')) return
    const itemsSnap = await getDocs(collection(firestore, 'grocery_users', user.uid, 'lists', id, 'items'))
    for (const itemDoc of itemsSnap.docs) {
      await deleteDoc(itemDoc.ref)
    }
    await deleteDoc(doc(firestore, 'grocery_users', user.uid, 'lists', id))
  }

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">Einkaufsliste</h1>
            <p className="text-base text-slate-500">Gemeinsam einkaufen</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark active:scale-95 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => signOut(auth)}
            className="w-11 h-11 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors"
            title="Abmelden"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 border border-red-200">
          {error}
        </div>
      )}

      {/* New List Form */}
      {showForm && (
        <form onSubmit={createList} className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-3">Neue Einkaufsliste</h2>
          <input
            type="text"
            placeholder="Name der Liste (z.B. Wocheneinkauf)"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-dark active:scale-[0.98] transition-all"
            >
              Erstellen
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setName('') }}
              className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Daily Recipe */}
      <div className="mb-5 relative bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 rounded-2xl border border-emerald-200 overflow-hidden">
        {/* Squirrel decoration — sitting with bushy tail */}
        <svg className="absolute top-2 right-2 w-14 h-14 text-emerald-300 opacity-50" viewBox="0 0 100 100" fill="currentColor">
          {/* Bushy tail */}
          <path d="M62 20 C72 8, 88 6, 90 18 C92 28, 84 32, 78 36 C74 38, 70 36, 68 34 C66 32, 64 28, 62 20Z"/>
          {/* Body */}
          <ellipse cx="58" cy="58" rx="14" ry="18"/>
          {/* Head */}
          <circle cx="50" cy="36" r="11"/>
          {/* Ear left */}
          <ellipse cx="44" cy="26" rx="3" ry="5" transform="rotate(-15 44 26)"/>
          {/* Ear right */}
          <ellipse cx="56" cy="26" rx="3" ry="5" transform="rotate(15 56 26)"/>
          {/* Eye */}
          <circle cx="47" cy="34" r="2" fill="#f0fdf4"/>
          {/* Nose */}
          <circle cx="42" cy="38" r="1.5" fill="#f0fdf4"/>
          {/* Front paws */}
          <ellipse cx="48" cy="68" rx="5" ry="3"/>
          {/* Back foot */}
          <ellipse cx="66" cy="74" rx="7" ry="3"/>
          {/* Acorn in paws */}
          <circle cx="44" cy="64" r="3" fill="#f0fdf4" opacity="0.6"/>
          <path d="M41 62 L47 62 L44 59Z" fill="#f0fdf4" opacity="0.6"/>
        </svg>

        <button
          onClick={() => setRecipeExpanded(!recipeExpanded)}
          className="w-full text-left p-4 flex items-start gap-3 relative z-10"
        >
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-0.5">Tagesrezept</p>
            <h3 className="text-lg font-semibold text-slate-900">{recipe.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{recipe.portions} Portionen</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{recipe.minutes} Min</span>
            </div>
          </div>
          <div className="mt-2 text-emerald-400">
            {recipeExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {recipeExpanded && (
          <div className="px-4 pb-4 relative z-10">
            <div className="bg-white/70 rounded-xl p-3 mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Zutaten</p>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={createListFromRecipe}
              disabled={recipeLoading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
            >
              <ShoppingBasket className="w-4 h-4" />
              {recipeLoading ? 'Wird erstellt...' : 'Zutaten zur Liste hinzufügen'}
            </button>
          </div>
        )}
      </div>

      {/* Lists */}
      {!lists ? (
        <div className="text-center py-12 text-slate-400">Laden...</div>
      ) : lists.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-400 mb-2">Keine Listen</h2>
          <p className="text-slate-400 mb-6">Erstelle deine erste Einkaufsliste</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-6 py-2.5 rounded-full font-medium hover:bg-primary-dark transition-colors"
          >
            Neue Liste
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {lists.map(list => (
            <div
              key={list.id}
              onClick={() => navigate(`/list/${list.id}`)}
              className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200 hover:border-primary hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-semibold text-slate-900 truncate">{list.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                    <span>{list.checkedCount ?? 0}/{list.itemCount ?? 0} erledigt</span>
                    <span>{formatDate(list.updatedAt)}</span>
                  </div>
                  {/* Progress bar */}
                  {(list.itemCount ?? 0) > 0 && (
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${((list.checkedCount ?? 0) / (list.itemCount ?? 1)) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={e => deleteList(e, list.id)}
                  className="ml-2 p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `vor ${days}T`
  return new Date(date).toLocaleDateString('de-DE')
}
