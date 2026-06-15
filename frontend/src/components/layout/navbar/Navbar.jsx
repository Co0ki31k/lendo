import { Link } from 'react-router-dom'
import { useAuth } from '../../../features/auth'
import { getDefaultRouteForUser } from '../../../lib/navigation'
import './Navbar.css'

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const homePath = getDefaultRouteForUser(user)
  const isClient = user?.role === 'CLIENT'
  const shouldShowClientNav = !isAuthenticated || isClient

  return (
    <header className="navbar">
      <Link to={homePath} className="navbar__brand">WeddMatch</Link>

      {shouldShowClientNav ? (
        <nav className="navbar__center" aria-label="Glowna nawigacja">
          <button type="button" className="navbar__link">Katalog sal</button>
          <span className="navbar__dot" aria-hidden="true">•</span>
          <button type="button" className="navbar__link">SmartPlaner</button>
          <span className="navbar__dot" aria-hidden="true">•</span>
          <button type="button" className="navbar__link">WeddChance</button>
          <span className="navbar__dot" aria-hidden="true">•</span>
          <button type="button" className="navbar__link">Ulubione</button>
        </nav>
      ) : null}

      <div className="navbar__actions">
        {isAuthenticated ? (
          <>
            <span className="navbar__status">
              {user?.role === 'ADMIN' ? 'Admin' : user?.role ?? 'CLIENT'}
            </span>
            <button type="button" className="navbar__button" onClick={logout}>
              Wyloguj sie
            </button>
          </>
        ) : (
          <>
            <span className="navbar__status navbar__status--guest">
              Konto goscia
            </span>
            <Link to="/register" className="navbar__button navbar__button--secondary">
              Rejestracja
            </Link>
            <Link to="/login" className="navbar__button">
              Logowanie
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar
