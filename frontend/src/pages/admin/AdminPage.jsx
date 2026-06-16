import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../api'
import './AdminPage.css'

const VENUE_STATUS_LABELS = {
  PENDING: 'Oczekuje',
  APPROVED: 'Zaakceptowany',
  REJECTED: 'Odrzucony',
  DRAFT: 'Do poprawy',
}

const INITIAL_PARTNER_QUERY = {
  page: 0,
  size: 10,
  search: '',
  verified: 'all',
  sortBy: 'createdAt',
  sortDir: 'desc',
}

const INITIAL_VENUE_QUERY = {
  page: 0,
  size: 8,
  search: '',
  status: 'all',
  sortBy: 'createdAt',
  sortDir: 'desc',
}

const EMPTY_PAGE = {
  page: 0,
  size: 0,
  totalItems: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
}

const EMPTY_PARTNER_RESPONSE = {
  items: [],
  page: EMPTY_PAGE,
  summary: {
    total: 0,
    verified: 0,
    pending: 0,
  },
}

const EMPTY_VENUE_RESPONSE = {
  items: [],
  page: EMPTY_PAGE,
  summary: {
    total: 0,
    pending: 0,
    approved: 0,
    draft: 0,
    rejected: 0,
  },
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatPrice(value) {
  if (value == null) {
    return '-'
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function buildPartnerParams(query) {
  return {
    page: query.page,
    size: query.size,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    ...(query.search.trim() ? { search: query.search.trim() } : {}),
    ...(query.verified !== 'all' ? { verified: query.verified === 'verified' } : {}),
  }
}

function buildVenueParams(query) {
  return {
    page: query.page,
    size: query.size,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    ...(query.search.trim() ? { search: query.search.trim() } : {}),
    ...(query.status !== 'all' ? { status: query.status } : {}),
  }
}

function PaginationControls({ page, onPageChange }) {
  return (
    <div className="admin-pagination">
      <button
        type="button"
        className="admin-page__refresh admin-page__refresh--secondary"
        onClick={() => onPageChange(page.page - 1)}
        disabled={!page.hasPrevious}
      >
        Poprzednia
      </button>
      <span className="admin-pagination__label">
        Strona {page.totalPages === 0 ? 0 : page.page + 1} z {page.totalPages}
      </span>
      <button
        type="button"
        className="admin-page__refresh admin-page__refresh--secondary"
        onClick={() => onPageChange(page.page + 1)}
        disabled={!page.hasNext}
      >
        Nastepna
      </button>
    </div>
  )
}

function AdminPage() {
  const [partnerQuery, setPartnerQuery] = useState(INITIAL_PARTNER_QUERY)
  const [venueQuery, setVenueQuery] = useState(INITIAL_VENUE_QUERY)
  const [partnerData, setPartnerData] = useState(EMPTY_PARTNER_RESPONSE)
  const [venueData, setVenueData] = useState(EMPTY_VENUE_RESPONSE)
  const [isLoadingPartners, setIsLoadingPartners] = useState(true)
  const [isLoadingVenues, setIsLoadingVenues] = useState(true)
  const [error, setError] = useState('')
  const [activeRequests, setActiveRequests] = useState({})
  const [expandedVenues, setExpandedVenues] = useState({})
  const [venueComments, setVenueComments] = useState({})

  const loadPartners = useCallback(async (query) => {
    setIsLoadingPartners(true)

    try {
      const response = await adminApi.getPartners(buildPartnerParams(query))
      setPartnerData(response)
    } catch (loadError) {
      setError(loadError.response?.data?.message ?? 'Nie udalo sie pobrac listy partnerow.')
    } finally {
      setIsLoadingPartners(false)
    }
  }, [])

  const loadVenues = useCallback(async (query) => {
    setIsLoadingVenues(true)

    try {
      const response = await adminApi.getVenues(buildVenueParams(query))
      setVenueData(response)
      setVenueComments(Object.fromEntries(response.items.map((venue) => [venue.id, venue.adminReviewComment ?? ''])))
    } catch (loadError) {
      setError(loadError.response?.data?.message ?? 'Nie udalo sie pobrac listy obiektow.')
    } finally {
      setIsLoadingVenues(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPartners(partnerQuery)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadPartners, partnerQuery])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadVenues(venueQuery)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadVenues, venueQuery])

  const partnerStats = partnerData.summary
  const venueStats = venueData.summary
  const partners = partnerData.items
  const venues = venueData.items

  function resetError() {
    setError('')
  }

  function updatePartnerQuery(patch) {
    resetError()
    setPartnerQuery((current) => ({
      ...current,
      ...patch,
    }))
  }

  function updateVenueQuery(patch) {
    resetError()
    setVenueQuery((current) => ({
      ...current,
      ...patch,
    }))
  }

  function handleRefresh() {
    resetError()
    void Promise.all([
      loadPartners(partnerQuery),
      loadVenues(venueQuery),
    ])
  }

  async function handlePartnerVerification(userId, verified) {
    const requestKey = `partner:${userId}`
    setActiveRequests((current) => ({ ...current, [requestKey]: true }))

    try {
      await adminApi.updatePartnerVerification(userId, verified)
      await loadPartners(partnerQuery)
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie zaktualizowac weryfikacji partnera.')
    } finally {
      setActiveRequests((current) => ({ ...current, [requestKey]: false }))
    }
  }

  async function handleVenueStatusUpdate(venueId, status) {
    const requestKey = `venue:${venueId}:${status}`
    setActiveRequests((current) => ({ ...current, [requestKey]: true }))

    try {
      const updatedVenue = await adminApi.updateVenueStatus(venueId, status, venueComments[venueId] ?? '')
      setVenueData((current) => ({
        ...current,
        items: current.items.map((venue) => (venue.id === venueId ? updatedVenue : venue)),
      }))
      setVenueComments((current) => ({
        ...current,
        [venueId]: updatedVenue.adminReviewComment ?? '',
      }))
      await loadVenues(venueQuery)
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie zaktualizowac statusu obiektu.')
    } finally {
      setActiveRequests((current) => ({ ...current, [requestKey]: false }))
    }
  }

  function toggleVenueDetails(venueId) {
    setExpandedVenues((current) => ({
      ...current,
      [venueId]: !current[venueId],
    }))
  }

  function handleVenueCommentChange(venueId, value) {
    setVenueComments((current) => ({
      ...current,
      [venueId]: value,
    }))
  }

  const venueStatusOptions = useMemo(() => [
    { value: 'all', label: 'Wszystkie statusy' },
    { value: 'PENDING', label: 'Oczekujace' },
    { value: 'DRAFT', label: 'Do poprawy' },
    { value: 'APPROVED', label: 'Zaakceptowane' },
    { value: 'REJECTED', label: 'Odrzucone' },
  ], [])

  return (
    <main className="admin-page">
      <section className="admin-page__header">
        <div>
          <span className="admin-page__eyebrow">Panel admina</span>
          <h1 className="admin-page__title">Weryfikacja partnerow i obiektow</h1>
          <p className="admin-page__text">
            Filtrowanie, sortowanie i paginacja dla review partnerow oraz sal.
          </p>
        </div>
        <button type="button" className="admin-page__refresh" onClick={handleRefresh}>
          Odswiez dane
        </button>
      </section>

      {error ? <p className="admin-page__error">{error}</p> : null}

      <section className="admin-page__stats" aria-label="Podsumowanie">
        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Partnerzy</span>
          <strong className="admin-page__stat-value">{partnerStats.total}</strong>
          <span className="admin-page__stat-meta">Zweryfikowani: {partnerStats.verified}</span>
        </article>
        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Do weryfikacji</span>
          <strong className="admin-page__stat-value">{partnerStats.pending}</strong>
          <span className="admin-page__stat-meta">Profile oczekujace</span>
        </article>
        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Obiekty</span>
          <strong className="admin-page__stat-value">{venueStats.total}</strong>
          <span className="admin-page__stat-meta">Oczekujace: {venueStats.pending}</span>
        </article>
        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Zaakceptowane</span>
          <strong className="admin-page__stat-value">{venueStats.approved}</strong>
          <span className="admin-page__stat-meta">Do poprawy: {venueStats.draft}</span>
        </article>
      </section>

      <section className="admin-page__section">
        <div className="admin-page__section-header">
          <div>
            <h2>Partnerzy</h2>
            <p>Lista wszystkich profili partnerow z mozliwoscia filtrowania i zmiany statusu weryfikacji.</p>
          </div>
        </div>

        <div className="admin-page__toolbar">
          <input
            type="search"
            className="admin-page__input"
            value={partnerQuery.search}
            onChange={(event) => updatePartnerQuery({ search: event.target.value, page: 0 })}
            placeholder="Szukaj po firmie, emailu lub NIP"
          />
          <select
            className="admin-page__select"
            value={partnerQuery.verified}
            onChange={(event) => updatePartnerQuery({ verified: event.target.value, page: 0 })}
          >
            <option value="all">Wszystkie statusy</option>
            <option value="verified">Zweryfikowani</option>
            <option value="pending">Oczekujacy</option>
          </select>
          <select
            className="admin-page__select"
            value={partnerQuery.sortBy}
            onChange={(event) => updatePartnerQuery({ sortBy: event.target.value, page: 0 })}
          >
            <option value="createdAt">Sortuj: data</option>
            <option value="companyName">Sortuj: firma</option>
            <option value="verified">Sortuj: status</option>
          </select>
          <select
            className="admin-page__select"
            value={partnerQuery.sortDir}
            onChange={(event) => updatePartnerQuery({ sortDir: event.target.value, page: 0 })}
          >
            <option value="desc">Malejaco</option>
            <option value="asc">Rosnaco</option>
          </select>
          <select
            className="admin-page__select"
            value={partnerQuery.size}
            onChange={(event) => updatePartnerQuery({ size: Number(event.target.value), page: 0 })}
          >
            <option value="10">10 / strona</option>
            <option value="20">20 / strona</option>
            <option value="50">50 / strona</option>
          </select>
        </div>

        {isLoadingPartners ? (
          <p className="admin-page__empty">Ladowanie partnerow...</p>
        ) : partners.length === 0 ? (
          <p className="admin-page__empty">Brak partnerow dla wybranych filtrow.</p>
        ) : (
          <>
            <div className="admin-page__table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Partner</th>
                    <th>Firma</th>
                    <th>Kontakt</th>
                    <th>Status</th>
                    <th>Utworzono</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => {
                    const requestKey = `partner:${partner.userId}`
                    const isSubmitting = Boolean(activeRequests[requestKey])

                    return (
                      <tr key={partner.userId}>
                        <td>
                          <strong>{partner.firstName} {partner.lastName}</strong>
                          <span>{partner.email}</span>
                        </td>
                        <td>
                          <strong>{partner.companyName || '-'}</strong>
                          <span>NIP: {partner.taxId || '-'}</span>
                        </td>
                        <td>
                          <strong>{partner.contactEmail || '-'}</strong>
                          <span>{partner.phoneNumber || '-'}</span>
                        </td>
                        <td>
                          <span className={`admin-badge ${partner.verified ? 'admin-badge--approved' : 'admin-badge--pending'}`}>
                            {partner.verified ? 'Zweryfikowany' : 'Oczekuje'}
                          </span>
                        </td>
                        <td>{formatDateTime(partner.createdAt)}</td>
                        <td>
                          <div className="admin-actions">
                            <button
                              type="button"
                              className="admin-action admin-action--approve"
                              disabled={isSubmitting || partner.verified}
                              onClick={() => handlePartnerVerification(partner.userId, true)}
                            >
                              Potwierdz
                            </button>
                            <button
                              type="button"
                              className="admin-action admin-action--reject"
                              disabled={isSubmitting || !partner.verified}
                              onClick={() => handlePartnerVerification(partner.userId, false)}
                            >
                              Cofnij
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <PaginationControls
              page={partnerData.page}
              onPageChange={(nextPage) => updatePartnerQuery({ page: nextPage })}
            />
          </>
        )}
      </section>

      <section className="admin-page__section">
        <div className="admin-page__section-header">
          <div>
            <h2>Obiekty</h2>
            <p>Review sal z filtrowaniem po statusie, wyszukiwaniem i kontrola sortowania.</p>
          </div>
        </div>

        <div className="admin-page__toolbar">
          <input
            type="search"
            className="admin-page__input"
            value={venueQuery.search}
            onChange={(event) => updateVenueQuery({ search: event.target.value, page: 0 })}
            placeholder="Szukaj po nazwie, adresie lub emailu managera"
          />
          <select
            className="admin-page__select"
            value={venueQuery.status}
            onChange={(event) => updateVenueQuery({ status: event.target.value, page: 0 })}
          >
            {venueStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            className="admin-page__select"
            value={venueQuery.sortBy}
            onChange={(event) => updateVenueQuery({ sortBy: event.target.value, page: 0 })}
          >
            <option value="createdAt">Sortuj: data</option>
            <option value="name">Sortuj: nazwa</option>
            <option value="status">Sortuj: status</option>
            <option value="basePricePerGuest">Sortuj: cena</option>
          </select>
          <select
            className="admin-page__select"
            value={venueQuery.sortDir}
            onChange={(event) => updateVenueQuery({ sortDir: event.target.value, page: 0 })}
          >
            <option value="desc">Malejaco</option>
            <option value="asc">Rosnaco</option>
          </select>
          <select
            className="admin-page__select"
            value={venueQuery.size}
            onChange={(event) => updateVenueQuery({ size: Number(event.target.value), page: 0 })}
          >
            <option value="8">8 / strona</option>
            <option value="16">16 / strona</option>
            <option value="24">24 / strona</option>
          </select>
        </div>

        {isLoadingVenues ? (
          <p className="admin-page__empty">Ladowanie obiektow...</p>
        ) : venues.length === 0 ? (
          <p className="admin-page__empty">Brak obiektow dla wybranych filtrow.</p>
        ) : (
          <>
            <div className="admin-page__cards">
              {venues.map((venue) => {
                const isExpanded = Boolean(expandedVenues[venue.id])

                return (
                  <article key={venue.id} className="admin-venue-card">
                    <div className="admin-venue-card__top">
                      <div>
                        <h3>{venue.name}</h3>
                        <p>{venue.address?.city || '-'}, {venue.address?.street || '-'}</p>
                      </div>
                      <span className={`admin-badge admin-badge--${venue.status.toLowerCase()}`}>
                        {VENUE_STATUS_LABELS[venue.status] ?? venue.status}
                      </span>
                    </div>

                    <dl className="admin-venue-card__meta">
                      <div>
                        <dt>Manager</dt>
                        <dd>{venue.managerEmail}</dd>
                      </div>
                      <div>
                        <dt>Zweryfikowany</dt>
                        <dd>{venue.verified ? 'Tak' : 'Nie'}</dd>
                      </div>
                      <div>
                        <dt>Dodano</dt>
                        <dd>{formatDateTime(venue.createdAt)}</dd>
                      </div>
                      <div>
                        <dt>Wojewodztwo</dt>
                        <dd>{venue.address?.voivodeship || '-'}</dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      className="admin-venue-card__details-toggle"
                      onClick={() => toggleVenueDetails(venue.id)}
                    >
                      {isExpanded ? 'Ukryj szczegoly zgloszenia' : 'Pokaz szczegoly zgloszenia'}
                    </button>

                    {isExpanded ? (
                      <section className="admin-venue-card__details" aria-label="Szczegoly zgloszenia">
                        <dl className="admin-venue-card__details-grid">
                          <div>
                            <dt>Styl</dt>
                            <dd>{venue.style || '-'}</dd>
                          </div>
                          <div>
                            <dt>Pojemnosc</dt>
                            <dd>{venue.capacityMin ?? '-'} - {venue.capacityMax ?? '-'}</dd>
                          </div>
                          <div>
                            <dt>Noclegi</dt>
                            <dd>{venue.hasAccommodation ? `Tak (${venue.accommodationPlaces ?? 0} miejsc)` : 'Nie'}</dd>
                          </div>
                          <div>
                            <dt>Cena od osoby</dt>
                            <dd>{formatPrice(venue.basePricePerGuest)}</dd>
                          </div>
                          <div>
                            <dt>Opata korkowa</dt>
                            <dd>{venue.noCorkageFee ? 'Brak' : 'Obowiazuje'}</dd>
                          </div>
                          <div>
                            <dt>Slub cywilny w ogrodzie</dt>
                            <dd>{venue.civilWeddingGarden ? 'Tak' : 'Nie'}</dd>
                          </div>
                          <div>
                            <dt>Kod pocztowy</dt>
                            <dd>{venue.address?.postalCode || '-'}</dd>
                          </div>
                          <div>
                            <dt>Wspolrzedne</dt>
                            <dd>{venue.address?.latitude ?? '-'}, {venue.address?.longitude ?? '-'}</dd>
                          </div>
                        </dl>
                        <div className="admin-venue-card__description">
                          <h4>Opis obiektu</h4>
                          <p>{venue.description || 'Brak opisu.'}</p>
                        </div>
                        <div className="admin-venue-card__description">
                          <h4>Komentarz dla managera</h4>
                          <textarea
                            className="admin-venue-card__comment"
                            value={venueComments[venue.id] ?? ''}
                            onChange={(event) => handleVenueCommentChange(venue.id, event.target.value)}
                            placeholder="Wpisz, co manager ma poprawic przed ponownym review."
                            rows="4"
                          />
                        </div>
                      </section>
                    ) : null}

                    <div className="admin-venue-card__actions">
                      <button
                        type="button"
                        className={`admin-action admin-action--approve ${venue.status === 'APPROVED' ? 'admin-action--current' : ''}`}
                        disabled={Boolean(activeRequests[`venue:${venue.id}:APPROVED`]) || venue.status === 'APPROVED'}
                        onClick={() => handleVenueStatusUpdate(venue.id, 'APPROVED')}
                      >
                        Zaakceptuj
                      </button>
                      <button
                        type="button"
                        className={`admin-action admin-action--draft ${venue.status === 'DRAFT' ? 'admin-action--current' : ''}`}
                        disabled={Boolean(activeRequests[`venue:${venue.id}:DRAFT`]) || !(venueComments[venue.id] ?? '').trim()}
                        onClick={() => handleVenueStatusUpdate(venue.id, 'DRAFT')}
                      >
                        Cofnij do poprawy
                      </button>
                      <button
                        type="button"
                        className={`admin-action admin-action--reject ${venue.status === 'REJECTED' ? 'admin-action--current' : ''}`}
                        disabled={Boolean(activeRequests[`venue:${venue.id}:REJECTED`]) || venue.status === 'REJECTED'}
                        onClick={() => handleVenueStatusUpdate(venue.id, 'REJECTED')}
                      >
                        Odrzuc
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            <PaginationControls
              page={venueData.page}
              onPageChange={(nextPage) => updateVenueQuery({ page: nextPage })}
            />
          </>
        )}
      </section>
    </main>
  )
}

export default AdminPage
