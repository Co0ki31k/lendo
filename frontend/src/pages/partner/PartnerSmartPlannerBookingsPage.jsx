import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { partnerApi } from '../../api'
import './PartnerSmartPlannerBookingsPage.css'

const STATUS_OPTIONS = ['', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED']

function formatCurrency(value) {
  if (value == null) {
    return '-'
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatStatus(status) {
  const labels = {
    SUBMITTED: 'Oczekuje',
    APPROVED: 'Zatwierdzony',
    REJECTED: 'Odrzucony',
    EXPIRED: 'Wygasl',
    CANCELLED: 'Anulowany',
  }

  return labels[status] ?? status
}

function PartnerSmartPlannerBookingsPage() {
  const [filters, setFilters] = useState({
    status: '',
    eventDateFrom: '',
    eventDateTo: '',
  })
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadBookings() {
      setStatus('loading')
      setError('')

      try {
        const response = await partnerApi.getSmartPlannerBookings({
          status: filters.status || undefined,
          eventDateFrom: filters.eventDateFrom || undefined,
          eventDateTo: filters.eventDateTo || undefined,
        })

        if (!isMounted) {
          return
        }

        setData(response)
        setStatus('ready')
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        setError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac bookingow smartplannera.')
        setStatus('error')
      }
    }

    void loadBookings()

    return () => {
      isMounted = false
    }
  }, [filters])

  const items = useMemo(() => data?.items ?? [], [data])

  return (
    <main className="partner-smartplanner">
      <section className="partner-smartplanner__hero">
        <span className="partner-smartplanner__eyebrow">Partner SmartPlanner</span>
        <h1>Bookingi do rozpatrzenia</h1>
        <p>Lista zgłoszeń klientów z filtrowaniem po statusie i dacie wydarzenia.</p>
      </section>

      <section className="partner-smartplanner__layout">
        <aside className="partner-smartplanner__filters">
          <div className="partner-smartplanner__filters-header">
            <span className="partner-smartplanner__eyebrow">Filtry</span>
            <h2>Zawęź listę</h2>
          </div>

          <label className="partner-smartplanner__field">
            <span>Status</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option || 'all'} value={option}>{option || 'Wszystkie'}</option>
              ))}
            </select>
          </label>

          <label className="partner-smartplanner__field">
            <span>Data od</span>
            <input
              type="date"
              value={filters.eventDateFrom}
              onChange={(event) => setFilters((current) => ({ ...current, eventDateFrom: event.target.value }))}
            />
          </label>

          <label className="partner-smartplanner__field">
            <span>Data do</span>
            <input
              type="date"
              value={filters.eventDateTo}
              onChange={(event) => setFilters((current) => ({ ...current, eventDateTo: event.target.value }))}
            />
          </label>
        </aside>

        <div className="partner-smartplanner__content">
          <section className="partner-smartplanner__summary">
            <article>
              <span>Wszystkie</span>
              <strong>{data?.summary?.total ?? 0}</strong>
            </article>
            <article>
              <span>Oczekujące</span>
              <strong>{data?.summary?.submitted ?? 0}</strong>
            </article>
            <article>
              <span>Zatwierdzone</span>
              <strong>{data?.summary?.approved ?? 0}</strong>
            </article>
            <article>
              <span>Odrzucone</span>
              <strong>{data?.summary?.rejected ?? 0}</strong>
            </article>
          </section>

          {status === 'loading' ? <div className="partner-smartplanner__loading">Ladowanie bookingow...</div> : null}
          {status === 'error' ? <p className="partner-smartplanner__error">{error}</p> : null}

          {status === 'ready' ? (
            items.length > 0 ? (
              <section className="partner-smartplanner__list">
                {items.map((booking) => (
                  <article key={booking.bookingId} className="partner-smartplanner__card">
                    <div className="partner-smartplanner__card-main">
                      <div className="partner-smartplanner__card-heading">
                        <div>
                          <span className={`partner-smartplanner__badge partner-smartplanner__badge--${booking.status.toLowerCase()}`}>
                            {formatStatus(booking.status)}
                          </span>
                          <h2>{booking.venueName}</h2>
                        </div>
                        <strong>{formatCurrency(booking.totalEstimatedCost)}</strong>
                      </div>

                      <div className="partner-smartplanner__meta">
                        <span>Termin: {formatDate(booking.eventDate)}</span>
                        <span>Goscie: {booking.estimatedGuests}</span>
                        <span>Klient: {booking.clientFirstName || '-'} {booking.clientLastName || ''}</span>
                        <span>Email: {booking.clientEmail}</span>
                      </div>
                    </div>

                    <div className="partner-smartplanner__card-side">
                      <Link to={`/partner/smartplanner/bookings/${booking.bookingId}`} className="partner-smartplanner__link">
                        Otworz
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            ) : (
              <p className="partner-smartplanner__empty">Brak bookingow dla wybranych filtrow.</p>
            )
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default PartnerSmartPlannerBookingsPage
