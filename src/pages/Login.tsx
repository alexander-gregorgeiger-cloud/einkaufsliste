import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { ShoppingCart } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || ''
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('E-Mail oder Passwort falsch')
      } else if (code === 'auth/email-already-in-use') {
        setError('E-Mail wird bereits verwendet')
      } else if (code === 'auth/weak-password') {
        setError('Passwort muss mindestens 6 Zeichen haben')
      } else {
        setError('Anmeldung fehlgeschlagen')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-3 sm:px-4 bg-gradient-to-b from-green-50 to-white">
      <div className="w-full max-w-md sm:max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShoppingCart className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Einkaufsliste</h1>
          <p className="text-slate-500 mt-1">Gemeinsam einkaufen</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? '...' : isSignUp ? 'Registrieren' : 'Anmelden'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-slate-500">
          {isSignUp ? 'Bereits registriert?' : 'Noch kein Konto?'}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            className="text-primary font-medium"
          >
            {isSignUp ? 'Anmelden' : 'Registrieren'}
          </button>
        </p>
      </div>
    </div>
  )
}
