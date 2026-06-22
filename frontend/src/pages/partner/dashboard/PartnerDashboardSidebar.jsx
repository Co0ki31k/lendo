function PartnerDashboardSidebar({
  selectedVenue,
  hasSelectedVenue,
  hasApprovedVenue,
  managerView,
  objectView,
  onManagerViewChange,
  onObjectViewChange,
}) {
  return (
    <aside className="partner-dashboard__sidebar">
      <section className="partner-dashboard__sidebar-section">
        <span className="partner-dashboard__sidebar-label">Aktualny obiekt</span>
        <strong className="partner-dashboard__sidebar-title">{selectedVenue?.name || 'Brak wybranego obiektu'}</strong>
        <span className="partner-dashboard__sidebar-meta">
          {selectedVenue ? `${selectedVenue.address?.city || '-'}, ${selectedVenue.address?.street || '-'}` : 'Wybierz obiekt z listy lub utworz nowy.'}
        </span>
      </section>

      <section className="partner-dashboard__sidebar-section">
        <span className="partner-dashboard__sidebar-label">Ogolne</span>
        <div className="partner-dashboard__nav-group">
          <button
            type="button"
            className={`partner-dashboard__nav-button${managerView === 'stats' ? ' partner-dashboard__nav-button--active' : ''}`}
            onClick={() => onManagerViewChange('stats')}
          >
            Statystyki
          </button>
          <button
            type="button"
            className={`partner-dashboard__nav-button${managerView === 'create' ? ' partner-dashboard__nav-button--active' : ''}`}
            onClick={() => onManagerViewChange('create')}
          >
            Utworz nowy obiekt
          </button>
          <button
            type="button"
            className={`partner-dashboard__nav-button${managerView === 'select' ? ' partner-dashboard__nav-button--active' : ''}`}
            onClick={() => onManagerViewChange('select')}
          >
            Wybor obiektu
          </button>
          <button
            type="button"
            className={`partner-dashboard__nav-button${managerView === 'smartplanner' ? ' partner-dashboard__nav-button--active' : ''}`}
            onClick={() => onManagerViewChange('smartplanner')}
          >
            Zgloszenia SmartPlanner
          </button>
          <button
            type="button"
            className={`partner-dashboard__nav-button${managerView === 'shopping' ? ' partner-dashboard__nav-button--active' : ''}`}
            onClick={() => onManagerViewChange('shopping')}
          >
            Lista zakupow
          </button>
          <button
            type="button"
            className={`partner-dashboard__nav-button${managerView === 'weddchance' ? ' partner-dashboard__nav-button--active' : ''}`}
            onClick={() => onManagerViewChange('weddchance')}
          >
            WeddChance
          </button>
        </div>
      </section>

      <section className="partner-dashboard__sidebar-section">
        <span className="partner-dashboard__sidebar-label">Wybrany obiekt</span>
        <div className="partner-dashboard__nav-group">
          <button
            type="button"
            className={`partner-dashboard__nav-button${managerView === 'object' && objectView === 'calendar' ? ' partner-dashboard__nav-button--active' : ''}`}
            onClick={() => hasSelectedVenue && onObjectViewChange('calendar')}
            disabled={!hasSelectedVenue}
          >
            Kalendarz
          </button>
          <button
            type="button"
            className={`partner-dashboard__nav-button${managerView === 'object' && objectView === 'messages' ? ' partner-dashboard__nav-button--active' : ''}`}
            onClick={() => hasApprovedVenue && onObjectViewChange('messages')}
            disabled={!hasApprovedVenue}
          >
            Wiadomosci
          </button>
          <button
            type="button"
            className={`partner-dashboard__nav-button${managerView === 'object' && objectView === 'edit' ? ' partner-dashboard__nav-button--active' : ''}`}
            onClick={() => hasSelectedVenue && onObjectViewChange('edit')}
            disabled={!hasSelectedVenue}
          >
            Edycja
          </button>
          <button
            type="button"
            className={`partner-dashboard__nav-button${managerView === 'object' && objectView === 'images' ? ' partner-dashboard__nav-button--active' : ''}`}
            onClick={() => hasSelectedVenue && onObjectViewChange('images')}
            disabled={!hasSelectedVenue}
          >
            Zdjecia
          </button>
          <button
            type="button"
            className={`partner-dashboard__nav-button${managerView === 'object' && objectView === 'menus' ? ' partner-dashboard__nav-button--active' : ''}`}
            onClick={() => hasSelectedVenue && onObjectViewChange('menus')}
            disabled={!hasSelectedVenue}
          >
            Menu i potrawy
          </button>
        </div>
      </section>
    </aside>
  )
}

export default PartnerDashboardSidebar
