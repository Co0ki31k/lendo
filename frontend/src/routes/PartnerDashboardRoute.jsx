import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth'
import PartnerDashboardPage from '../pages/partner/PartnerDashboardPage.jsx'

function PartnerDashboardRoute() {
  const { isAuthenticated, isInitializing, user } = useAuth()

  if (isInitializing) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  return <PartnerDashboardPage />
}

export default PartnerDashboardRoute
