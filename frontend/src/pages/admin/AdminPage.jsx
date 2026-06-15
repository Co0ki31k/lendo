import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../api'
import './AdminPage.css'

const VENUE_STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED', 'DRAFT']

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

function AdminPage() {
  const [partners, setPartners] = useState([])
  const [venues, setVenues] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeRequests, setActiveRequests] = useState({})

  const fetchAdminData = useCallback(async ({ showLoader = true, clearError = true } = {}) => {
    if (showLoader) {
      setIsLoading(true)
    }

    if (clearError) {
      setError('')
    }

    try {
      const [partnersResponse, venuesResponse] = await Promise.all([
        adminApi.getPartners(),
        adminApi.getVenues(),
      ])

      setPartners(partnersResponse)
      setVenues(venuesResponse)
    } catch (loadError) {
      setError(loadError.response?.data?.message ?? 'Nie udalo sie pobrac danych panelu admina.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadAdminData = useCallback(() => {
    void fetchAdminData()
  }, [fetchAdminData])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchAdminData({ showLoader: false, clearError: false })
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [fetchAdminData])

  const partnerStats = useMemo(() => ({
    total: partners.length,
    verified: partners.filter((partner) => partner.verified).length,
    pending: partners.filter((partner) => !partner.verified).length,
  }), [partners])

  const venueStats = useMemo(() => ({
    total: venues.length,
    pending: venues.filter((venue) => venue.status === 'PENDING').length,
    approved: venues.filter((venue) => venue.status === 'APPROVED').length,
  }), [venues])

  async function handlePartnerVerification(userId, verified) {
    const requestKey = `partner:${userId}`
    setActiveRequests((current) => ({ ...current, [requestKey]: true }))

    try {
      const updatedPartner = await adminApi.updatePartnerVerification(userId, verified)
      setPartners((current) => current.map((partner) => (
        partner.userId === userId ? updatedPartner : partner
      )))
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
      const updatedVenue = await adminApi.updateVenueStatus(venueId, status)
      setVenues((current) => current.map((venue) => (
        venue.id === venueId ? updatedVenue : venue
      )))
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie zaktualizowac statusu obiektu.')
    } finally {
      setActiveRequests((current) => ({ ...current, [requestKey]: false }))
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-page__header">
        <div>
          <span className="admin-page__eyebrow">Panel admina</span>
          <h1 className="admin-page__title">Weryfikacja partnerow i obiektow</h1>
          <p className="admin-page__text">
            Jeden widok do obslugi profili partnerow oraz review sal.
          </p>
        </div>
        <button type="button" className="admin-page__refresh" onClick={loadAdminData}>
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
          <span className="admin-page__stat-meta">Pending: {venueStats.pending}</span>
        </article>
        <article className="admin-page__stat">
          <span className="admin-page__stat-label">Zaakceptowane</span>
          <strong className="admin-page__stat-value">{venueStats.approved}</strong>
          <span className="admin-page__stat-meta">Sale po review</span>
        </article>
      </section>

      <section className="admin-page__section">
        <div className="admin-page__section-header">
          <div>
            <h2>Partnerzy</h2>
            <p>Lista wszystkich profili partnerow z mozliwoscia zmiany statusu weryfikacji.</p>
          </div>
        </div>

        {isLoading ? (
          <p className="admin-page__empty">Ladowanie partnerow...</p>
        ) : partners.length === 0 ? (
          <p className="admin-page__empty">Brak profili partnerow.</p>
        ) : (
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
        )}
      </section>

      <section className="admin-page__section">
        <div className="admin-page__section-header">
          <div>
            <h2>Obiekty</h2>
            <p>Review sal z szybka zmiana statusu i podgladem managera.</p>
          </div>
        </div>

        {isLoading ? (
          <p className="admin-page__empty">Ladowanie obiektow...</p>
        ) : venues.length === 0 ? (
          <p className="admin-page__empty">Brak obiektow do review.</p>
        ) : (
          <div className="admin-page__cards">
            {venues.map((venue) => (
              <article key={venue.id} className="admin-venue-card">
                <div className="admin-venue-card__top">
                  <div>
                    <h3>{venue.name}</h3>
                    <p>{venue.address?.city || '-'}, {venue.address?.street || '-'}</p>
                  </div>
                  <span className={`admin-badge admin-badge--${venue.status.toLowerCase()}`}>
                    {venue.status}
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

                <div className="admin-venue-card__actions">
                  {VENUE_STATUS_OPTIONS.map((status) => {
                    const requestKey = `venue:${venue.id}:${status}`
                    const isSubmitting = Boolean(activeRequests[requestKey])

                    return (
                      <button
                        key={status}
                        type="button"
                        className={`admin-action ${venue.status === status ? 'admin-action--current' : ''}`}
                        disabled={isSubmitting || venue.status === status}
                        onClick={() => handleVenueStatusUpdate(venue.id, status)}
                      >
                        {status}
                      </button>
                    )
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminPage
