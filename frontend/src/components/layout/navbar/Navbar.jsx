import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../../features/auth'
import './Navbar.css'

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">WeddMatch</Link>

      <nav className="navbar__center" aria-label="Glowna nawigacja">
        <button type="button" className="navbar__link">Katalog sal</button>
        <button type="button" className="navbar__link">SmartPlaner</button>
        <button type="button" className="navbar__link">WeddChance</button>
        <button type="button" className="navbar__link">Ulubione</button>
      </nav>

      <div className="navbar__actions">
        <button type="button" className="navbar__link navbar__link--accent">
          Strefa partnera
        </button>
        {isAdmin ? (
          <NavLink
            to="/admin"
            className={({ isActive }) => `navbar__link navbar__link--pill${isActive ? ' navbar__link--active' : ''}`}
          >
            Admin
          </NavLink>
        ) : null}
        {isAuthenticated ? (
          <>
            <span className="navbar__status">
              {user?.role ?? 'CLIENT'}
            </span>
            <button type="button" className="navbar__button" onClick={logout}>
              Wyloguj sie
            </button>
          </>
        ) : (
          <>
            <NavLink to="/register" className="navbar__link navbar__link--pill">
              Rejestracja
            </NavLink>
            <NavLink to="/login" className="navbar__button navbar__button--link">
              Zaloguj sie
            </NavLink>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar
