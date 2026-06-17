import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { smartPlannerApi } from '../../api'
import { SMART_PLANNER_STATUS_OPTIONS, formatSmartPlannerStatus } from '../../features/smartplanner/statusLabels.js'
import './SmartPlannerBookingsPage.css'

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

function SmartPlannerBookingsPage() {
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
        const response = await smartPlannerApi.getMyBookings({
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
    <main className="smartplanner-bookings">
      <section className="smartplanner-bookings__hero">
        <span className="smartplanner-bookings__eyebrow">SmartPlanner</span>
        <h1>Moje zgłoszenia</h1>
        <p>Tu sprawdzisz status wysłanych formularzy i wejdziesz w szczegóły konkretnego bookingu.</p>
      </section>

      <section className="smartplanner-bookings__layout">
        <aside className="smartplanner-bookings__filters">
          <div className="smartplanner-bookings__filters-header">
            <span className="smartplanner-bookings__eyebrow">Filtry</span>
            <h2>Zawęź listę</h2>
          </div>

          <label className="smartplanner-bookings__field">
            <span>Status</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              {SMART_PLANNER_STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="smartplanner-bookings__field">
            <span>Data od</span>
            <input
              type="date"
              value={filters.eventDateFrom}
              onChange={(event) => setFilters((current) => ({ ...current, eventDateFrom: event.target.value }))}
            />
          </label>

          <label className="smartplanner-bookings__field">
            <span>Data do</span>
            <input
              type="date"
              value={filters.eventDateTo}
              onChange={(event) => setFilters((current) => ({ ...current, eventDateTo: event.target.value }))}
            />
          </label>
        </aside>

        <div className="smartplanner-bookings__content">
          <section className="smartplanner-bookings__summary">
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

          {status === 'loading' ? (
            <div className="smartplanner-bookings__loading">Ladowanie bookingow...</div>
          ) : null}
          {status === 'error' ? <p className="smartplanner-bookings__error">{error}</p> : null}

          {status === 'ready' ? (
            items.length > 0 ? (
              <section className="smartplanner-bookings__list">
                {items.map((booking) => (
                  <article key={booking.bookingId} className="smartplanner-bookings__card">
                    <div className="smartplanner-bookings__card-main">
                      <div className="smartplanner-bookings__card-heading">
                        <div>
                          <span className={`smartplanner-bookings__badge smartplanner-bookings__badge--${booking.status.toLowerCase()}`}>
                            {formatSmartPlannerStatus(booking.status)}
                          </span>
                          <h2>{booking.venueName}</h2>
                        </div>
                        <strong>{formatCurrency(booking.totalEstimatedCost)}</strong>
                      </div>

                      <div className="smartplanner-bookings__meta">
                        <span>Termin: {formatDate(booking.eventDate)}</span>
                        <span>Goscie: {booking.estimatedGuests}</span>
                        <span>Service: {booking.fullService ? 'Full service' : 'Bez full service'}</span>
                      </div>
                    </div>

                    <div className="smartplanner-bookings__card-side">
                      <Link to={`/smartplanner/bookings/${booking.bookingId}`} className="smartplanner-bookings__link">
                        Szczegoly
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            ) : (
              <p className="smartplanner-bookings__empty">Brak zgłoszeń dla wybranych filtrów.</p>
            )
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default SmartPlannerBookingsPage
