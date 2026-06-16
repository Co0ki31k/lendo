import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { partnerApi } from '../../api'
import './PartnerDashboardPage.css'

const INITIAL_VENUE_FORM_VALUES = {
  name: '',
  description: '',
  style: '',
  capacityMin: '80',
  capacityMax: '120',
  hasAccommodation: false,
  accommodationPlaces: '0',
  basePricePerGuest: '0',
  noCorkageFee: false,
  civilWeddingGarden: false,
  street: '',
  city: '',
  postalCode: '',
  voivodeship: '',
  latitude: '',
  longitude: '',
}

function formatMoney(value) {
  if (value == null) {
    return '-'
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(value)
}

function PartnerDashboardPage() {
  const [profile, setProfile] = useState(null)
  const [venues, setVenues] = useState([])
  const [venueFormValues, setVenueFormValues] = useState(INITIAL_VENUE_FORM_VALUES)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [isVenueSubmitting, setIsVenueSubmitting] = useState(false)

  const loadDashboardData = useCallback(async () => {
    setStatus('loading')
    setError('')

    try {
      const [profileResponse, venuesResponse] = await Promise.all([
        partnerApi.getPartnerProfile(),
        partnerApi.getOwnVenues(),
      ])
      setProfile(profileResponse)
      setVenues(venuesResponse)
      setStatus('ready')
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac dashboardu managera.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboardData()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadDashboardData])

  function handleVenueChange(event) {
    const { name, value, type, checked } = event.target
    setVenueFormValues((currentValues) => ({
      ...currentValues,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function buildVenuePayload() {
    return {
      ...venueFormValues,
      capacityMin: Number(venueFormValues.capacityMin),
      capacityMax: Number(venueFormValues.capacityMax),
      accommodationPlaces: Number(venueFormValues.accommodationPlaces),
      basePricePerGuest: Number(venueFormValues.basePricePerGuest),
      latitude: Number(venueFormValues.latitude),
      longitude: Number(venueFormValues.longitude),
    }
  }

  async function handleVenueSubmit(event) {
    event.preventDefault()
    setIsVenueSubmitting(true)
    setError('')

    try {
      const createdVenue = await partnerApi.createVenue(buildVenuePayload())
      setVenues((currentVenues) => [createdVenue, ...currentVenues])
      setVenueFormValues(INITIAL_VENUE_FORM_VALUES)
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie dodac obiektu.')
    } finally {
      setIsVenueSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <main className="partner-dashboard">
        <section className="partner-dashboard__panel">
          <p className="partner-dashboard__empty">Ladowanie dashboardu managera...</p>
        </section>
      </main>
    )
  }

  if (profile && !profile.verified) {
    return <Navigate to="/partner" replace />
  }

  if (status === 'error') {
    return (
      <main className="partner-dashboard">
        <section className="partner-dashboard__panel">
          <span className="partner-dashboard__eyebrow">Strefa partnera</span>
          <h1 className="partner-dashboard__title">Nie udalo sie pobrac dashboardu</h1>
          <p className="partner-dashboard__text">Sprobuj odswiezyc strone. Jesli problem sie powtarza, sprawdz status konta partnera.</p>
          {error ? <p className="partner-dashboard__error">{error}</p> : null}
        </section>
      </main>
    )
  }

  return (
    <main className="partner-dashboard">
      <section className="partner-dashboard__panel">
        <span className="partner-dashboard__eyebrow">Dashboard managera</span>
        <h1 className="partner-dashboard__title">Moje obiekty</h1>
        <p className="partner-dashboard__text">
          Zarzadzaj lista sal i dodawaj nowe obiekty do swojego konta managera.
        </p>

        <section className="partner-dashboard__section">
          <div className="partner-dashboard__section-header">
            <div>
              <h2>Lista obiektow</h2>
              <p>Aktualne sale przypisane do Twojego konta.</p>
            </div>
            <button type="button" className="partner-dashboard__secondary-action" onClick={() => void loadDashboardData()}>
              Odswiez
            </button>
          </div>

          {error ? <p className="partner-dashboard__error">{error}</p> : null}

          {venues.length === 0 ? (
            <p className="partner-dashboard__empty">Nie masz jeszcze zadnych obiektow.</p>
          ) : (
            <div className="partner-dashboard__venue-list">
              {venues.map((venue) => (
                <article key={venue.id} className="partner-dashboard__venue-card">
                  <div className="partner-dashboard__venue-top">
                    <div>
                      <h3>{venue.name}</h3>
                      <p>{venue.address?.city || '-'}, {venue.address?.street || '-'}</p>
                    </div>
                    <span className={`partner-dashboard__status-badge partner-dashboard__status-badge--${venue.status?.toLowerCase()}`}>
                      {venue.status}
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
                    <div>
                      <dt>Noclegi</dt>
                      <dd>{venue.hasAccommodation ? `${venue.accommodationPlaces} miejsc` : 'Brak'}</dd>
                    </div>
                    <div>
                      <dt>Publikacja</dt>
                      <dd>{venue.verified ? 'Zweryfikowany' : 'Wymaga akcji'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="partner-dashboard__section">
          <div className="partner-dashboard__section-header">
            <div>
              <h2>Dodaj obiekt</h2>
              <p>Podstawowe dane obiektu. Zdjecia i wysylke do akceptacji podepniemy w kolejnym kroku.</p>
            </div>
          </div>

          <form className="partner-dashboard__form" onSubmit={handleVenueSubmit}>
            <label className="partner-dashboard__field">
              <span>Nazwa obiektu</span>
              <input name="name" type="text" value={venueFormValues.name} onChange={handleVenueChange} required />
            </label>

            <label className="partner-dashboard__field">
              <span>Styl</span>
              <input name="style" type="text" value={venueFormValues.style} onChange={handleVenueChange} required />
            </label>

            <label className="partner-dashboard__field">
              <span>Pojemnosc minimalna</span>
              <input name="capacityMin" type="number" min="1" value={venueFormValues.capacityMin} onChange={handleVenueChange} required />
            </label>

            <label className="partner-dashboard__field">
              <span>Pojemnosc maksymalna</span>
              <input name="capacityMax" type="number" min="1" value={venueFormValues.capacityMax} onChange={handleVenueChange} required />
            </label>

            <label className="partner-dashboard__field">
              <span>Cena bazowa za goscia</span>
              <input name="basePricePerGuest" type="number" min="0" step="1" value={venueFormValues.basePricePerGuest} onChange={handleVenueChange} required />
            </label>

            <label className="partner-dashboard__field">
              <span>Miejsca noclegowe</span>
              <input name="accommodationPlaces" type="number" min="0" value={venueFormValues.accommodationPlaces} onChange={handleVenueChange} required />
            </label>

            <label className="partner-dashboard__field">
              <span>Miasto</span>
              <input name="city" type="text" value={venueFormValues.city} onChange={handleVenueChange} required />
            </label>

            <label className="partner-dashboard__field">
              <span>Wojewodztwo</span>
              <input name="voivodeship" type="text" value={venueFormValues.voivodeship} onChange={handleVenueChange} required />
            </label>

            <label className="partner-dashboard__field partner-dashboard__field--full">
              <span>Ulica</span>
              <input name="street" type="text" value={venueFormValues.street} onChange={handleVenueChange} required />
            </label>

            <label className="partner-dashboard__field">
              <span>Kod pocztowy</span>
              <input name="postalCode" type="text" value={venueFormValues.postalCode} onChange={handleVenueChange} required />
            </label>

            <label className="partner-dashboard__field">
              <span>Szerokosc geograficzna</span>
              <input name="latitude" type="number" min="-90" max="90" step="0.000001" value={venueFormValues.latitude} onChange={handleVenueChange} required />
            </label>

            <label className="partner-dashboard__field">
              <span>Dlugosc geograficzna</span>
              <input name="longitude" type="number" min="-180" max="180" step="0.000001" value={venueFormValues.longitude} onChange={handleVenueChange} required />
            </label>

            <label className="partner-dashboard__field partner-dashboard__field--full">
              <span>Opis</span>
              <textarea name="description" value={venueFormValues.description} onChange={handleVenueChange} rows="5" />
            </label>

            <div className="partner-dashboard__toggles partner-dashboard__field--full">
              <label className="partner-dashboard__toggle">
                <input name="hasAccommodation" type="checkbox" checked={venueFormValues.hasAccommodation} onChange={handleVenueChange} />
                <span>Obiekt ma noclegi</span>
              </label>

              <label className="partner-dashboard__toggle">
                <input name="noCorkageFee" type="checkbox" checked={venueFormValues.noCorkageFee} onChange={handleVenueChange} />
                <span>Bez oplaty korkowej</span>
              </label>

              <label className="partner-dashboard__toggle">
                <input name="civilWeddingGarden" type="checkbox" checked={venueFormValues.civilWeddingGarden} onChange={handleVenueChange} />
                <span>Slub cywilny w ogrodzie</span>
              </label>
            </div>

            <button type="submit" className="partner-dashboard__submit" disabled={isVenueSubmitting}>
              {isVenueSubmitting ? 'Zapisywanie...' : 'Dodaj obiekt'}
            </button>
          </form>
        </section>
      </section>
    </main>
  )
}

export default PartnerDashboardPage
