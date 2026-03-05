import { Routes, Route } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Login from './pages/Login'
import ShoppingLists from './pages/ShoppingLists'
import ListDetail from './pages/ListDetail'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Routes>
      <Route path="/" element={<ShoppingLists />} />
      <Route path="/list/:id" element={<ListDetail />} />
    </Routes>
  )
}
