import './Navbar.css'

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__brand">WeddMatch</div>

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
        <button type="button" className="navbar__button">
          Zaloguj sie
        </button>
      </div>
    </header>
  )
}

export default Navbar
