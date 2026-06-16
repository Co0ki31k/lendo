import './App.css'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/layout/navbar/Navbar.jsx'
import HomePlaceholder from './pages/home/HomePlaceholder.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import OAuthCallbackPage from './pages/oauth-callback/OAuthCallbackPage.jsx'
import AdminRoute from './routes/AdminRoute.jsx'
import PartnerRoute from './routes/PartnerRoute.jsx'

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePlaceholder />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/partner" element={<PartnerRoute />} />
      </Routes>
    </div>
  )
}

export default App
