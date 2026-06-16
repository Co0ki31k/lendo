import { formatMoney, formatVenueStatus } from './utils'

function SelectVenueView({
  venues,
  actionableVenueIds,
  selectedVenueId,
  onVenueSelect,
  onRefresh,
}) {
  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Wybor obiektu</span>
          <h2>Twoje obiekty</h2>
          <p>Obiekty zatwierdzone i cofnie­te do poprawy mozna wybrac do dalszej pracy.</p>
        </div>
        <button type="button" className="partner-dashboard__secondary-action" onClick={onRefresh}>
          Odswiez
        </button>
      </div>

      {venues.length === 0 ? (
        <p className="partner-dashboard__empty">Nie masz jeszcze zadnych obiektow.</p>
      ) : (
        <div className="partner-dashboard__venue-list">
          {venues.map((venue) => {
            const isActionable = actionableVenueIds.includes(venue.id)

            return (
              <button
                key={venue.id}
                type="button"
                className={`partner-dashboard__venue-card-button${selectedVenueId === venue.id ? ' partner-dashboard__venue-card-button--active' : ''}${!isActionable ? ' partner-dashboard__venue-card-button--disabled' : ''}`}
                onClick={() => isActionable && onVenueSelect(venue.id)}
                disabled={!isActionable}
              >
                <div className="partner-dashboard__venue-top">
                  <div>
                    <h3>{venue.name}</h3>
                    <p>{venue.address?.city || '-'}, {venue.address?.street || '-'}</p>
                  </div>
                  <span className={`partner-dashboard__status-badge partner-dashboard__status-badge--${venue.status?.toLowerCase()}`}>
                    {formatVenueStatus(venue.status)}
                  </span>
                </div>

                <dl className="partner-dashboard__venue-meta">
                  <div>
                    <dt>Pojemnosc</dt>
                    <dd>{venue.capacityMin} - {venue.capacityMax} gosci</dd>
                  </div>
                  <div>
                    <dt>Cena bazowa</dt>
                    <dd>{formatMoney(venue.basePricePerGuest)}</dd>
                  </div>
                </dl>

                {venue.adminReviewComment ? (
                  <div className="partner-dashboard__venue-feedback">
                    <strong>Komentarz admina</strong>
                    <span>{venue.adminReviewComment}</span>
                  </div>
                ) : null}

                {!isActionable ? (
                  <p className="partner-dashboard__venue-note">
                    Ten obiekt nie jest jeszcze zatwierdzony, wiec nie moze byc aktywnym obiektem dashboardu.
                  </p>
                ) : null}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default SelectVenueView
