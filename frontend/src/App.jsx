import './App.css'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/layout/navbar/Navbar.jsx'
import CatalogPage from './pages/catalog/CatalogPage.jsx'
import VenueDetailPage from './pages/catalog/VenueDetailPage.jsx'
import FavoritesPage from './pages/favorites/FavoritesPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import OAuthCallbackPage from './pages/oauth-callback/OAuthCallbackPage.jsx'
import AdminRoute from './routes/AdminRoute.jsx'
import PartnerRoute from './routes/PartnerRoute.jsx'
import PartnerDashboardRoute from './routes/PartnerDashboardRoute.jsx'
import ClientRoute from './routes/ClientRoute.jsx'
import SmartPlannerPage from './pages/smartplanner/SmartPlannerPage.jsx'
import SmartPlannerBookingsPage from './pages/smartplanner/SmartPlannerBookingsPage.jsx'
import SmartPlannerBookingDetailPage from './pages/smartplanner/SmartPlannerBookingDetailPage.jsx'
import PartnerSmartPlannerBookingsPage from './pages/partner/PartnerSmartPlannerBookingsPage.jsx'
import PartnerSmartPlannerBookingDetailPage from './pages/partner/PartnerSmartPlannerBookingDetailPage.jsx'
import WeddChancePage from './pages/weddchance/WeddChancePage.jsx'

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/venues/:venueId" element={<VenueDetailPage />} />
        <Route path="/weddchance" element={<WeddChancePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
        <Route path="/smartplanner" element={<ClientRoute><SmartPlannerPage /></ClientRoute>} />
        <Route path="/smartplanner/bookings" element={<ClientRoute><SmartPlannerBookingsPage /></ClientRoute>} />
        <Route path="/smartplanner/bookings/:bookingId" element={<ClientRoute><SmartPlannerBookingDetailPage /></ClientRoute>} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/partner" element={<PartnerRoute />} />
        <Route path="/partner/dashboard" element={<PartnerDashboardRoute />} />
        <Route path="/partner/smartplanner/bookings" element={<PartnerRoute><PartnerSmartPlannerBookingsPage /></PartnerRoute>} />
        <Route path="/partner/smartplanner/bookings/:bookingId" element={<PartnerRoute><PartnerSmartPlannerBookingDetailPage /></PartnerRoute>} />
      </Routes>
    </div>
  )
}

export default App
