import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth'
import PartnerZonePage from '../pages/partner/PartnerZonePage.jsx'

function PartnerRoute({ children }) {
  const { isAuthenticated, isInitializing, user } = useAuth()

  if (isInitializing) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (children && user?.role !== 'MANAGER' && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  if (user?.role === 'ADMIN') {
    return children ?? <Navigate to="/admin" replace />
  }

  return children ?? <PartnerZonePage />
}

export default PartnerRoute
