import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth'

function ClientRoute({ children }) {
  const { isAuthenticated, isInitializing, user } = useAuth()

  if (isInitializing) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'CLIENT') {
    return <Navigate to="/" replace />
  }

  return children
}

export default ClientRoute
