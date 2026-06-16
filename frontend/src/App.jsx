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

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/venues/:venueId" element={<VenueDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/partner" element={<PartnerRoute />} />
        <Route path="/partner/dashboard" element={<PartnerDashboardRoute />} />
      </Routes>
    </div>
  )
}

export default App
