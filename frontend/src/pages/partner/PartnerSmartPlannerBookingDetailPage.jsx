import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { partnerApi } from '../../api'
import { formatSmartPlannerStatus } from '../../features/smartplanner/statusLabels.js'
import './PartnerSmartPlannerBookingDetailPage.css'

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

function PartnerSmartPlannerBookingDetailPage() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [decision, setDecision] = useState('APPROVED')
  const [comment, setComment] = useState('')
  const [submitState, setSubmitState] = useState('idle')

  useEffect(() => {
    let isMounted = true

    async function loadBooking() {
      setStatus('loading')
      setError('')

      try {
        const response = await partnerApi.getSmartPlannerBookingDetails(bookingId)

        if (!isMounted) {
          return
        }

        setBooking(response)
        setComment(response.decisionComment ?? '')
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

  async function handleDecisionSubmit(event) {
    event.preventDefault()
    setSubmitState('loading')
    setError('')

    try {
      const response = await partnerApi.decideSmartPlannerBooking(bookingId, {
        decision,
        comment: comment || null,
      })

      setBooking(response)
      setComment(response.decisionComment ?? '')
      setSubmitState('success')
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie zapisac decyzji.')
      setSubmitState('error')
    }
  }

  if (status === 'loading') {
    return <main className="partner-smartplanner-detail"><div className="partner-smartplanner-detail__loading">Ladowanie szczegolow...</div></main>
  }

  if (status === 'error') {
    return <main className="partner-smartplanner-detail"><p className="partner-smartplanner-detail__error">{error}</p></main>
  }

  const canDecide = booking.status === 'SUBMITTED'

  return (
    <main className="partner-smartplanner-detail">
      <div className="partner-smartplanner-detail__topbar">
        <Link to="/partner/smartplanner/bookings" className="partner-smartplanner-detail__back-link">
          Wroc do bookingow
        </Link>
      </div>

      <section className="partner-smartplanner-detail__panel">
        <header className="partner-smartplanner-detail__header">
          <div>
            <span className="partner-smartplanner-detail__eyebrow">Booking #{booking.bookingId}</span>
            <h1>{booking.venueName}</h1>
            <p>Status: {formatSmartPlannerStatus(booking.status)}</p>
          </div>
          <div className={`partner-smartplanner-detail__status partner-smartplanner-detail__status--${booking.status.toLowerCase()}`}>
            {formatSmartPlannerStatus(booking.status)}
          </div>
        </header>

        <section className="partner-smartplanner-detail__grid">
          <article>
            <span>Termin</span>
            <strong>{formatDate(booking.eventDate)}</strong>
          </article>
          <article>
            <span>Klient</span>
            <strong>{booking.clientFirstName || '-'} {booking.clientLastName || ''}</strong>
          </article>
          <article>
            <span>Email</span>
            <strong>{booking.clientEmail}</strong>
          </article>
          <article>
            <span>Goscie</span>
            <strong>{booking.estimatedGuests}</strong>
          </article>
          <article>
            <span>Cena za osobe</span>
            <strong>{formatCurrency(booking.pricePerGuest)}</strong>
          </article>
          <article>
            <span>Budzet max klienta</span>
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
        </section>

        <section className="partner-smartplanner-detail__block">
          <h2>Menu i alergie</h2>
          <div className="partner-smartplanner-detail__grid partner-smartplanner-detail__grid--compact">
            <article><span>Standard</span><strong>{booking.dietLogistics.menuStandardCount}</strong></article>
            <article><span>Vegetarian</span><strong>{booking.dietLogistics.menuVegetarianCount}</strong></article>
            <article><span>Vegan</span><strong>{booking.dietLogistics.menuVeganCount}</strong></article>
            <article><span>Gluten free</span><strong>{booking.dietLogistics.menuGlutenFreeCount}</strong></article>
          </div>
          <p>{booking.dietLogistics.allergiesNotes || 'Brak uwag o alergiach.'}</p>
        </section>

        <section className="partner-smartplanner-detail__block">
          <h2>Uwagi klienta</h2>
          <p>{booking.serviceNotes || 'Brak dodatkowych uwag.'}</p>
        </section>

        <section className="partner-smartplanner-detail__block">
          <h2>Decyzja managera</h2>
          {error ? <p className="partner-smartplanner-detail__error partner-smartplanner-detail__error--inline">{error}</p> : null}
          {submitState === 'success' ? <p className="partner-smartplanner-detail__success">Decyzja zostala zapisana.</p> : null}

          <form className="partner-smartplanner-detail__decision-form" onSubmit={(event) => void handleDecisionSubmit(event)}>
            <label className="partner-smartplanner-detail__field">
              <span>Decyzja</span>
              <select value={decision} onChange={(event) => setDecision(event.target.value)} disabled={!canDecide}>
                <option value="APPROVED">Zatwierdz</option>
                <option value="REJECTED">Odrzuc</option>
              </select>
            </label>

            <label className="partner-smartplanner-detail__field partner-smartplanner-detail__field--full">
              <span>Komentarz</span>
              <textarea
                rows="5"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                disabled={!canDecide}
              />
            </label>

            <button
              type="submit"
              className="partner-smartplanner-detail__submit"
              disabled={!canDecide || submitState === 'loading'}
            >
              {submitState === 'loading' ? 'Zapisywanie...' : canDecide ? 'Zapisz decyzje' : 'Booking juz rozpatrzony'}
            </button>
          </form>

          <div className="partner-smartplanner-detail__decision-meta">
            <span>Rozpatrzono: {booking.decidedAt ? formatDate(booking.decidedAt, true) : 'Jeszcze nie rozpatrzono'}</span>
            <span>Komentarz zapisany: {booking.decisionComment || 'Brak'}</span>
          </div>
        </section>
      </section>
    </main>
  )
}

export default PartnerSmartPlannerBookingDetailPage
