import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { useParams } from 'react-router-dom'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { catalogApi } from '../../api'
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
  const { venueId } = useParams()
  const [venue, setVenue] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)

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

  const activeImage = useMemo(() => venue?.images?.[activeImageIndex] ?? null, [venue, activeImageIndex])
  const coordinates = useMemo(() => {
    const latitude = Number(venue?.address?.latitude)
    const longitude = Number(venue?.address?.longitude)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null
    }

    return [latitude, longitude]
  }, [venue])

  if (status === 'loading') {
    return <main className="venue-detail"><p className="venue-detail__empty">Ladowanie szczegolow sali...</p></main>
  }

  if (status === 'error') {
    return <main className="venue-detail"><p className="venue-detail__error">{error}</p></main>
  }

  return (
    <main className="venue-detail">
      <section className="venue-detail__panel">
        <header className="venue-detail__header">
          <div>
            <span className="venue-detail__eyebrow">Sala</span>
            <h1>{venue.name}</h1>
            <p>{venue.address.city}, {venue.address.street}, {venue.address.voivodeship}</p>
          </div>
        </header>

        <section className="venue-detail__gallery">
          {activeImage ? (
            <img
              src={activeImage.imageUrl}
              alt={venue.name}
              className="venue-detail__hero-image"
            />
          ) : (
            <div className="venue-detail__hero-image venue-detail__hero-image--fallback">Brak zdjec</div>
          )}

          {venue.images?.length ? (
            <div className="venue-detail__thumbs">
              {venue.images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={`venue-detail__thumb${index === activeImageIndex ? ' venue-detail__thumb--active' : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={image.imageUrl} alt={`${venue.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          ) : null}
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
              <span>Opata korkowa</span>
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
