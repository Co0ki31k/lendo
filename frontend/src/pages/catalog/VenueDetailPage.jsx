import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { catalogApi, favoriteApi } from '../../api'
import { useAuth } from '../../features/auth'
import './VenueDetailPage.css'

const venueMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const minimumSliderSlots = 4

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

function VenueDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const contactSectionRef = useRef(null)
  const { isAuthenticated, user } = useAuth()
  const { venueId } = useParams()
  const [venue, setVenue] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [inquiryForm, setInquiryForm] = useState({
    contactEmail: '',
    contactPhone: '',
    messageText: '',
  })
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false)
  const [inquiryMessage, setInquiryMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadVenue() {
      setStatus('loading')
      setError('')

      try {
        const response = await catalogApi.getVenueDetails(venueId)

        if (!isMounted) {
          return
        }

        setVenue(response)
        const primaryIndex = response.images?.findIndex((image) => image.primaryImage) ?? -1
        setActiveImageIndex(primaryIndex >= 0 ? primaryIndex : 0)
        setStatus('ready')
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        setError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac szczegolow sali.')
        setStatus('error')
      }
    }

    void loadVenue()

    return () => {
      isMounted = false
    }
  }, [venueId])

  useEffect(() => {
    if (status !== 'ready' || location.state?.focus !== 'contact') {
      return
    }

    contactSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate, status])

  const gallerySliderItems = useMemo(() => {
    const images = venue?.images ?? []

    return Array.from({ length: Math.max(minimumSliderSlots, images.length) }, (_, index) => images[index] ?? null)
  }, [venue])
  const imageCount = gallerySliderItems.length
  const activeImage = useMemo(() => gallerySliderItems[activeImageIndex] ?? null, [gallerySliderItems, activeImageIndex])
  const isClient = user?.role === 'CLIENT'
  const coordinates = useMemo(() => {
    const latitude = Number(venue?.address?.latitude)
    const longitude = Number(venue?.address?.longitude)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null
    }

    return [latitude, longitude]
  }, [venue])

  function handleImageStep(direction) {
    if (!imageCount) {
      return
    }

    setActiveImageIndex((current) => {
      const nextIndex = current + direction

      if (nextIndex < 0) {
        return imageCount - 1
      }

      if (nextIndex >= imageCount) {
        return 0
      }

      return nextIndex
    })
  }

  function handleInquiryFieldChange(field, value) {
    setInquiryForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleFavoriteToggle() {
    if (!venue) {
      return
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    if (!isClient) {
      return
    }

    try {
      if (venue.favorite) {
        await favoriteApi.removeFavorite(venue.id)
      } else {
        await favoriteApi.addFavorite(venue.id)
      }

      setVenue((current) => (
        current
          ? { ...current, favorite: !current.favorite }
          : current
      ))
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie zaktualizowac ulubionych.')
    }
  }

  async function handleInquirySubmit(event) {
    event.preventDefault()
    setError('')
    setInquiryMessage('')
    setIsSubmittingInquiry(true)

    try {
      await catalogApi.createVenueInquiry(venueId, inquiryForm)
      setInquiryMessage('Wiadomosc zostala wyslana do obiektu.')
      setInquiryForm((current) => ({
        ...current,
        messageText: '',
      }))
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie wyslac wiadomosci do obiektu.')
    } finally {
      setIsSubmittingInquiry(false)
    }
  }

  if (status === 'loading') {
    return (
      <main className="venue-detail">
        <div className="venue-detail__loading" role="status" aria-live="polite">
          Ladowanie szczegolow sali...
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return <main className="venue-detail"><p className="venue-detail__error">{error}</p></main>
  }

  return (
    <main className="venue-detail">
      <div className="venue-detail__topbar">
        <Link to="/" className="venue-detail__back-link">
          Wroc do katalogu
        </Link>
      </div>

      <section className="venue-detail__panel">
        <header className="venue-detail__header">
          <div>
            <span className="venue-detail__eyebrow">Sala</span>
            <h1>{venue.name}</h1>
            <p>{venue.address.city}, {venue.address.street}, {venue.address.voivodeship}</p>
          </div>

          <button
            type="button"
            className={`venue-detail__favorite-button${venue.favorite ? ' venue-detail__favorite-button--active' : ''}`}
            onClick={() => void handleFavoriteToggle()}
          >
            {venue.favorite ? 'Polubione' : 'Polub'}
          </button>
        </header>

        <section className="venue-detail__gallery">
          <div className="venue-detail__slider-shell">
            <div className="venue-detail__slider-main">
              {imageCount > 1 ? (
                <button
                  type="button"
                  className="venue-detail__slider-button venue-detail__slider-button--left"
                  onClick={() => handleImageStep(-1)}
                  aria-label="Poprzednie zdjecie"
                >
                  {'<'}
                </button>
              ) : null}

              {activeImage ? (
                <img
                  src={activeImage.imageUrl}
                  alt={venue.name}
                  className="venue-detail__hero-image"
                />
              ) : (
                <div className="venue-detail__hero-image venue-detail__hero-image--fallback">Brak zdjec</div>
              )}

              {imageCount > 1 ? (
                <button
                  type="button"
                  className="venue-detail__slider-button venue-detail__slider-button--right"
                  onClick={() => handleImageStep(1)}
                  aria-label="Nastepne zdjecie"
                >
                  {'>'}
                </button>
              ) : null}

            </div>
          </div>
        </section>

        <section className="venue-detail__content">
          <div className="venue-detail__info-grid">
            <article>
              <span>Cena bazowa za goscia</span>
              <strong>{formatPrice(venue.basePricePerGuest)}</strong>
            </article>
            <article>
              <span>Pojemnosc</span>
              <strong>{venue.capacityMin} - {venue.capacityMax}</strong>
            </article>
            <article>
              <span>Styl</span>
              <strong>{venue.style || '-'}</strong>
            </article>
            <article>
              <span>Noclegi</span>
              <strong>{venue.hasAccommodation ? `Tak (${venue.accommodationPlaces ?? 0} miejsc)` : 'Nie'}</strong>
            </article>
            <article>
              <span>Oplata korkowa</span>
              <strong>{venue.noCorkageFee ? 'Brak' : 'Obowiazuje'}</strong>
            </article>
            <article>
              <span>Slub cywilny w ogrodzie</span>
              <strong>{venue.civilWeddingGarden ? 'Tak' : 'Nie'}</strong>
            </article>
            <article>
              <span>Adres</span>
              <strong>{venue.address.street}, {venue.address.postalCode} {venue.address.city}</strong>
            </article>
            <article>
              <span>Wspolrzedne</span>
              <strong>{venue.address.latitude}, {venue.address.longitude}</strong>
            </article>
          </div>

          <section className="venue-detail__description">
            <h2>Opis obiektu</h2>
            <p>{venue.description || 'Brak opisu.'}</p>
          </section>

          <section ref={contactSectionRef} className="venue-detail__contact-section">
            <div className="venue-detail__section-heading">
              <h2>Napisz do obiektu</h2>
              <p>Wyslij kontakt i tresc wiadomosci. Zapytanie zostanie zapisane dla tego obiektu.</p>
            </div>

            {inquiryMessage ? <p className="venue-detail__success">{inquiryMessage}</p> : null}
            {isSubmittingInquiry ? (
              <div className="venue-detail__loading venue-detail__loading--inline" role="status" aria-live="polite">
                Wysylanie wiadomosci...
              </div>
            ) : null}

            <form className="venue-detail__contact-form" onSubmit={handleInquirySubmit}>
              <label className="venue-detail__field">
                <span>Email</span>
                <input
                  type="email"
                  value={inquiryForm.contactEmail}
                  onChange={(event) => handleInquiryFieldChange('contactEmail', event.target.value)}
                  placeholder="anna@przyklad.pl"
                  required
                />
              </label>

              <label className="venue-detail__field">
                <span>Numer telefonu</span>
                <input
                  type="text"
                  value={inquiryForm.contactPhone}
                  onChange={(event) => handleInquiryFieldChange('contactPhone', event.target.value)}
                  placeholder="+48 500 000 000"
                />
              </label>

              <label className="venue-detail__field venue-detail__field--full">
                <span>Tresc wiadomosci</span>
                <textarea
                  value={inquiryForm.messageText}
                  onChange={(event) => handleInquiryFieldChange('messageText', event.target.value)}
                  placeholder="Napisz kilka zdan o terminie, liczbie gosci i oczekiwaniach."
                  rows={6}
                  required
                />
              </label>

              <div className="venue-detail__contact-actions">
                <button type="submit" className="venue-detail__submit-button" disabled={isSubmittingInquiry}>
                  {isSubmittingInquiry ? 'Trwa wysylanie...' : 'Wyslij wiadomosc'}
                </button>
              </div>
            </form>
          </section>

          {coordinates ? (
            <section className="venue-detail__map-section">
              <div className="venue-detail__section-heading">
                <h2>Lokalizacja</h2>
                <p>Mapa pokazuje polozenie obiektu na podstawie zapisanych wspolrzednych.</p>
              </div>

              <MapContainer
                center={coordinates}
                zoom={13}
                scrollWheelZoom={false}
                className="venue-detail__map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={coordinates} icon={venueMarkerIcon}>
                  <Popup>Obiekt</Popup>
                </Marker>
              </MapContainer>
            </section>
          ) : null}
        </section>
      </section>
    </main>
  )
}

export default VenueDetailPage
