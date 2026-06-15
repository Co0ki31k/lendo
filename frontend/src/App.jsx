import './App.css'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/layout/navbar/Navbar.jsx'
import HomePlaceholder from './pages/home/HomePlaceholder.jsx'
import OAuthCallbackPage from './pages/oauth-callback/OAuthCallbackPage.jsx'

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePlaceholder />} />
        <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
      </Routes>
    </div>
  )
}

export default App
