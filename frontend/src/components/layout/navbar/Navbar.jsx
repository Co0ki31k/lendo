import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../../features/auth'
import { getDefaultRouteForUser } from '../../../lib/navigation'
import './Navbar.css'

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const homePath = getDefaultRouteForUser(user)
  const isClient = user?.role === 'CLIENT'
  const isManager = user?.role === 'MANAGER'
  const isAdmin = user?.role === 'ADMIN'
  const shouldShowClientNav = !isAuthenticated || (!isManager && !isAdmin)

  return (
    <header className="navbar">
      <Link to={homePath} className="navbar__brand">WeddMatch</Link>

      {shouldShowClientNav ? (
        <nav className="navbar__center" aria-label="Glowna nawigacja">
          <NavLink to="/" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>Katalog sal</NavLink>
          <span className="navbar__dot" aria-hidden="true">|</span>
          <NavLink to="/smartplanner" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>SmartPlanner</NavLink>
          <span className="navbar__dot" aria-hidden="true">|</span>
          {isAuthenticated && isClient ? (
            <>
              <NavLink to="/smartplanner/bookings" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>Moje zgloszenia</NavLink>
              <span className="navbar__dot" aria-hidden="true">|</span>
            </>
          ) : null}
          <NavLink to="/weddchance" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>WeddChance</NavLink>
          <span className="navbar__dot" aria-hidden="true">|</span>
          <NavLink to="/favorites" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>Ulubione</NavLink>
        </nav>
      ) : null}

      <div className="navbar__actions">
        {isAuthenticated ? (
          <>
            {(isClient || isManager) ? (
              <Link to="/partner" className="navbar__button navbar__button--secondary">
                Strefa partnera
              </Link>
            ) : null}
            <span className="navbar__status">
              {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'MANAGER' ? 'Manager' : 'User'}
            </span>
            <button type="button" className="navbar__button" onClick={logout}>
              Wyloguj sie
            </button>
          </>
        ) : (
          <>
            <span className="navbar__status navbar__status--guest">
              Gosc
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
