import { formatMoney, formatVenueStatus } from './utils'

function SelectVenueView({
  venues,
  actionableVenueIds,
  selectedVenueId,
  venueQuery,
  pageMeta,
  onVenueSelect,
  onVenueQueryChange,
  onRefresh,
}) {
  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Wybor obiektu</span>
          <h2>Twoje obiekty</h2>
          <p>Filtruj, sortuj i przechodz po stronach, zeby pracowac na salach do dalszej obslugi.</p>
        </div>
        <button type="button" className="partner-dashboard__secondary-action" onClick={onRefresh}>
          Odswiez
        </button>
      </div>

      <div className="partner-dashboard__toolbar">
        <input
          type="search"
          className="partner-dashboard__input"
          value={venueQuery.search}
          onChange={(event) => onVenueQueryChange({ search: event.target.value, page: 0 })}
          placeholder="Szukaj po nazwie, stylu lub adresie"
        />
        <select
          className="partner-dashboard__select"
          value={venueQuery.status}
          onChange={(event) => onVenueQueryChange({ status: event.target.value, page: 0 })}
        >
          <option value="all">Wszystkie statusy</option>
          <option value="APPROVED">Zaakceptowane</option>
          <option value="DRAFT">Do poprawy</option>
          <option value="PENDING">Oczekujace</option>
          <option value="REJECTED">Odrzucone</option>
        </select>
        <select
          className="partner-dashboard__select"
          value={venueQuery.sortBy}
          onChange={(event) => onVenueQueryChange({ sortBy: event.target.value, page: 0 })}
        >
          <option value="createdAt">Sortuj: data</option>
          <option value="name">Sortuj: nazwa</option>
          <option value="status">Sortuj: status</option>
          <option value="basePricePerGuest">Sortuj: cena</option>
        </select>
        <select
          className="partner-dashboard__select"
          value={venueQuery.sortDir}
          onChange={(event) => onVenueQueryChange({ sortDir: event.target.value, page: 0 })}
        >
          <option value="desc">Malejaco</option>
          <option value="asc">Rosnaco</option>
        </select>
        <select
          className="partner-dashboard__select"
          value={venueQuery.size}
          onChange={(event) => onVenueQueryChange({ size: Number(event.target.value), page: 0 })}
        >
          <option value="8">8 / strona</option>
          <option value="16">16 / strona</option>
          <option value="24">24 / strona</option>
        </select>
      </div>

      {venues.length === 0 ? (
        <p className="partner-dashboard__empty">Brak obiektow dla wybranych filtrow.</p>
      ) : (
        <>
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
                      Tego obiektu nie da sie teraz wybrac do pracy w dashboardzie.
                    </p>
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="partner-dashboard__pagination">
            <button
              type="button"
              className="partner-dashboard__secondary-action"
              onClick={() => onVenueQueryChange({ page: pageMeta.page - 1 })}
              disabled={!pageMeta.hasPrevious}
            >
              Poprzednia
            </button>
            <span className="partner-dashboard__pagination-label">
              Strona {pageMeta.totalPages === 0 ? 0 : pageMeta.page + 1} z {pageMeta.totalPages}
            </span>
            <button
              type="button"
              className="partner-dashboard__secondary-action"
              onClick={() => onVenueQueryChange({ page: pageMeta.page + 1 })}
              disabled={!pageMeta.hasNext}
            >
              Nastepna
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default SelectVenueView
