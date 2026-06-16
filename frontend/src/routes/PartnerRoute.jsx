import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth'
import PartnerZonePage from '../pages/partner/PartnerZonePage.jsx'

function PartnerRoute() {
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

  return <PartnerZonePage />
}

export default PartnerRoute
