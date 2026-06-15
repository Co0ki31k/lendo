import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth'
import AdminPage from '../pages/admin/AdminPage.jsx'

function AdminRoute() {
  const { isAuthenticated, isInitializing, user } = useAuth()

  if (isInitializing) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return <AdminPage />
}

export default AdminRoute
