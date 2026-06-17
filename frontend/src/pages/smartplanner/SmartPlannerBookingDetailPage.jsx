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
      </section>
    </main>
  )
}

export default SmartPlannerBookingDetailPage
