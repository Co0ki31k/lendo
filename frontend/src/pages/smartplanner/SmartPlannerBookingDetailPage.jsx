import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { smartPlannerApi } from '../../api'
import { formatSmartPlannerStatus } from '../../features/smartplanner/statusLabels.js'
import './SmartPlannerBookingDetailPage.css'

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

function formatDate(value, withTime = false) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pl-PL', withTime ? {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  } : {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function SmartPlannerBookingDetailPage() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [editForm, setEditForm] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [actionState, setActionState] = useState({ status: 'idle', error: '' })

  useEffect(() => {
    let isMounted = true

    async function loadBooking() {
      setStatus('loading')
      setError('')

      try {
        const response = await smartPlannerApi.getBookingDetails(bookingId)

        if (!isMounted) {
          return
        }

        setBooking(response)
        setEditForm({
          maxPricePerGuest: response.maxPricePerGuest ?? '',
          fullService: String(response.fullService),
          estimatedGuests: response.estimatedGuests,
          menuStandardCount: response.dietLogistics.menuStandardCount,
          menuVegetarianCount: response.dietLogistics.menuVegetarianCount,
          menuVeganCount: response.dietLogistics.menuVeganCount,
          menuGlutenFreeCount: response.dietLogistics.menuGlutenFreeCount,
          allergiesNotes: response.dietLogistics.allergiesNotes ?? '',
          serviceNotes: response.serviceNotes ?? '',
          requestNotes: '',
        })
        setCancelReason(response.clientRequestNotes ?? '')
        setStatus('ready')
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        setError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac szczegolow bookingu.')
        setStatus('error')
      }
    }

    void loadBooking()

    return () => {
      isMounted = false
    }
  }, [bookingId])

  if (status === 'loading') {
    return <main className="smartplanner-booking-detail"><div className="smartplanner-booking-detail__loading">Ladowanie szczegolow...</div></main>
  }

  const isApproved = booking.status === 'APPROVED'
  const isWithoutService = editForm?.fullService === 'false'

  async function handleEditSubmit(event) {
    event.preventDefault()
    setActionState({ status: 'loading', error: '' })

    try {
      const response = await smartPlannerApi.updateBooking(bookingId, {
        maxPricePerGuest: Number(editForm.maxPricePerGuest),
        fullService: editForm.fullService === 'true',
        estimatedGuests: Number(editForm.estimatedGuests),
        menuStandardCount: isWithoutService ? 0 : Number(editForm.menuStandardCount),
        menuVegetarianCount: isWithoutService ? 0 : Number(editForm.menuVegetarianCount),
        menuVeganCount: isWithoutService ? 0 : Number(editForm.menuVeganCount),
        menuGlutenFreeCount: isWithoutService ? 0 : Number(editForm.menuGlutenFreeCount),
        allergiesNotes: editForm.allergiesNotes || null,
        serviceNotes: editForm.serviceNotes || null,
        requestNotes: editForm.requestNotes || null,
      })

      setBooking(response)
      setActionState({ status: 'success', error: '' })
    } catch (requestError) {
      setActionState({
        status: 'error',
        error: requestError.response?.data?.message ?? 'Nie udalo sie wyslac prosby o zmiane.',
      })
    }
  }

  async function handleCancellationRequest(event) {
    event.preventDefault()
    setActionState({ status: 'loading', error: '' })

    try {
      const response = await smartPlannerApi.requestBookingCancellation(bookingId, {
        reason: cancelReason,
      })
      setBooking(response)
      setActionState({ status: 'success', error: '' })
    } catch (requestError) {
      setActionState({
        status: 'error',
        error: requestError.response?.data?.message ?? 'Nie udalo sie wyslac prosby o anulacje.',
      })
    }
  }

  if (status === 'error') {
    return <main className="smartplanner-booking-detail"><p className="smartplanner-booking-detail__error">{error}</p></main>
  }

  return (
    <main className="smartplanner-booking-detail">
      <div className="smartplanner-booking-detail__topbar">
        <Link to="/smartplanner/bookings" className="smartplanner-booking-detail__back-link">
          Wroc do moich zgloszen
        </Link>
      </div>

      <section className="smartplanner-booking-detail__panel">
        <header className="smartplanner-booking-detail__header">
          <div>
            <span className="smartplanner-booking-detail__eyebrow">Booking #{booking.bookingId}</span>
            <h1>{booking.venueName}</h1>
            <p>Status: {formatSmartPlannerStatus(booking.status)}</p>
          </div>
          <div className={`smartplanner-booking-detail__status smartplanner-booking-detail__status--${booking.status.toLowerCase()}`}>
            {formatSmartPlannerStatus(booking.status)}
          </div>
        </header>

        <section className="smartplanner-booking-detail__grid">
          <article>
            <span>Termin</span>
            <strong>{formatDate(booking.eventDate)}</strong>
          </article>
          <article>
            <span>Liczba gosci</span>
            <strong>{booking.estimatedGuests}</strong>
          </article>
          <article>
            <span>Cena za osobe</span>
            <strong>{formatCurrency(booking.pricePerGuest)}</strong>
          </article>
          <article>
            <span>Budzet max za osobe</span>
            <strong>{formatCurrency(booking.maxPricePerGuest)}</strong>
          </article>
          <article>
            <span>Koszt estymowany</span>
            <strong>{formatCurrency(booking.totalEstimatedCost)}</strong>
          </article>
          <article>
            <span>Service</span>
            <strong>{booking.fullService ? 'Full service' : 'Bez full service'}</strong>
          </article>
          <article>
            <span>Wyslane</span>
            <strong>{formatDate(booking.createdAt, true)}</strong>
          </article>
          <article>
            <span>Decyzja</span>
            <strong>{booking.decidedAt ? formatDate(booking.decidedAt, true) : 'Jeszcze nie rozpatrzono'}</strong>
          </article>
        </section>

        <section className="smartplanner-booking-detail__block">
          <h2>Konfiguracja menu</h2>
          <div className="smartplanner-booking-detail__grid smartplanner-booking-detail__grid--compact">
            <article>
              <span>Standard</span>
              <strong>{booking.dietLogistics.menuStandardCount}</strong>
            </article>
            <article>
              <span>Vegetarian</span>
              <strong>{booking.dietLogistics.menuVegetarianCount}</strong>
            </article>
            <article>
              <span>Vegan</span>
              <strong>{booking.dietLogistics.menuVeganCount}</strong>
            </article>
            <article>
              <span>Gluten free</span>
              <strong>{booking.dietLogistics.menuGlutenFreeCount}</strong>
            </article>
          </div>
        </section>

        <section className="smartplanner-booking-detail__block">
          <h2>Alergie</h2>
          <p>{booking.dietLogistics.allergiesNotes || 'Brak dodatkowych uwag o alergiach.'}</p>
        </section>

        <section className="smartplanner-booking-detail__block">
          <h2>Uwagi do service</h2>
          <p>{booking.serviceNotes || 'Brak dodatkowych uwag.'}</p>
        </section>

        <section className="smartplanner-booking-detail__block">
          <h2>Komentarz managera</h2>
          <p>{booking.decisionComment || 'Brak komentarza.'}</p>
        </section>

        {booking.clientRequestNotes ? (
          <section className="smartplanner-booking-detail__block">
            <h2>Ostatnia prosba klienta</h2>
            <p>{booking.clientRequestNotes}</p>
          </section>
        ) : null}

        {booking.pendingChange ? (
          <section className="smartplanner-booking-detail__block">
            <h2>Zmiany oczekujace na akceptacje</h2>
            <div className="smartplanner-booking-detail__grid smartplanner-booking-detail__grid--compact">
              <article><span>Gosci</span><strong>{booking.pendingChange.estimatedGuests}</strong></article>
              <article><span>Budzet max</span><strong>{formatCurrency(booking.pendingChange.maxPricePerGuest)}</strong></article>
              <article><span>Service</span><strong>{booking.pendingChange.fullService ? 'Full service' : 'Bez full service'}</strong></article>
              <article><span>Standard</span><strong>{booking.pendingChange.dietLogistics.menuStandardCount}</strong></article>
            </div>
            <p>{booking.pendingChange.requestNotes || 'Brak uzasadnienia zmiany.'}</p>
          </section>
        ) : null}

        {isApproved ? (
          <section className="smartplanner-booking-detail__block">
            <h2>Prosba o zmiane rezerwacji</h2>
            <form className="smartplanner-booking-detail__form" onSubmit={(event) => void handleEditSubmit(event)}>
              <label className="smartplanner-booking-detail__field">
                <span>Maksymalny budzet / osoba</span>
                <input
                  type="number"
                  min="0"
                  value={editForm.maxPricePerGuest}
                  onChange={(event) => setEditForm((current) => ({ ...current, maxPricePerGuest: event.target.value }))}
                />
              </label>

              <label className="smartplanner-booking-detail__field">
                <span>Service</span>
                <select
                  value={editForm.fullService}
                  onChange={(event) => setEditForm((current) => ({
                    ...current,
                    fullService: event.target.value,
                    ...(event.target.value === 'false'
                      ? {
                          menuStandardCount: 0,
                          menuVegetarianCount: 0,
                          menuVeganCount: 0,
                          menuGlutenFreeCount: 0,
                        }
                      : {}),
                  }))}
                >
                  <option value="true">Full service</option>
                  <option value="false">Bez full service</option>
                </select>
              </label>

              <label className="smartplanner-booking-detail__field">
                <span>Gosci</span>
                <input
                  type="number"
                  min="1"
                  value={editForm.estimatedGuests}
                  onChange={(event) => setEditForm((current) => ({ ...current, estimatedGuests: event.target.value }))}
                />
              </label>

              <label className="smartplanner-booking-detail__field">
                <span>Menu standard</span>
                <input
                  type="number"
                  min="0"
                  disabled={isWithoutService}
                  value={editForm.menuStandardCount}
                  onChange={(event) => setEditForm((current) => ({ ...current, menuStandardCount: event.target.value }))}
                />
              </label>

              <label className="smartplanner-booking-detail__field">
                <span>Menu vegetarian</span>
                <input
                  type="number"
                  min="0"
                  disabled={isWithoutService}
                  value={editForm.menuVegetarianCount}
                  onChange={(event) => setEditForm((current) => ({ ...current, menuVegetarianCount: event.target.value }))}
                />
              </label>

              <label className="smartplanner-booking-detail__field">
                <span>Menu vegan</span>
                <input
                  type="number"
                  min="0"
                  disabled={isWithoutService}
                  value={editForm.menuVeganCount}
                  onChange={(event) => setEditForm((current) => ({ ...current, menuVeganCount: event.target.value }))}
                />
              </label>

              <label className="smartplanner-booking-detail__field">
                <span>Menu gluten free</span>
                <input
                  type="number"
                  min="0"
                  disabled={isWithoutService}
                  value={editForm.menuGlutenFreeCount}
                  onChange={(event) => setEditForm((current) => ({ ...current, menuGlutenFreeCount: event.target.value }))}
                />
              </label>

              <label className="smartplanner-booking-detail__field smartplanner-booking-detail__field--full">
                <span>Alergie</span>
                <textarea rows="4" value={editForm.allergiesNotes} onChange={(event) => setEditForm((current) => ({ ...current, allergiesNotes: event.target.value }))} />
              </label>

              <label className="smartplanner-booking-detail__field smartplanner-booking-detail__field--full">
                <span>Uwagi do service</span>
                <textarea rows="4" value={editForm.serviceNotes} onChange={(event) => setEditForm((current) => ({ ...current, serviceNotes: event.target.value }))} />
              </label>

              <label className="smartplanner-booking-detail__field smartplanner-booking-detail__field--full">
                <span>Uzasadnienie zmiany</span>
                <textarea rows="4" value={editForm.requestNotes} onChange={(event) => setEditForm((current) => ({ ...current, requestNotes: event.target.value }))} />
              </label>

              <button type="submit" className="smartplanner-booking-detail__action" disabled={actionState.status === 'loading'}>
                {actionState.status === 'loading' ? 'Wysylanie...' : 'Wyslij prosbe o zmiane'}
              </button>
            </form>
          </section>
        ) : null}

        {isApproved ? (
          <section className="smartplanner-booking-detail__block">
            <h2>Prosba o anulacje</h2>
            <form className="smartplanner-booking-detail__form" onSubmit={(event) => void handleCancellationRequest(event)}>
              <label className="smartplanner-booking-detail__field smartplanner-booking-detail__field--full">
                <span>Powod anulacji</span>
                <textarea rows="4" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
              </label>

              <button type="submit" className="smartplanner-booking-detail__action smartplanner-booking-detail__action--danger" disabled={actionState.status === 'loading'}>
                {actionState.status === 'loading' ? 'Wysylanie...' : 'Wyslij prosbe o anulacje'}
              </button>
            </form>
          </section>
        ) : null}

        {actionState.status === 'error' ? <p className="smartplanner-booking-detail__error smartplanner-booking-detail__error--inline">{actionState.error}</p> : null}
        {actionState.status === 'success' ? <div className="smartplanner-booking-detail__success">Prosba zostala wyslana do managera.</div> : null}
      </section>
    </main>
  )
}

export default SmartPlannerBookingDetailPage
