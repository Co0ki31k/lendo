import { useEffect, useState } from 'react'
import { geocodingApi, partnerApi } from '../../../api'
import VenueFormFields from './VenueFormFields.jsx'
import VenueImagesManager from './VenueImagesManager.jsx'
import { buildVenuePayload, createVenueFormValues } from './venueForm.js'

function EditVenueView({ selectedVenue, onVenueUpdated }) {
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false)
  const [coordinatePreview, setCoordinatePreview] = useState(null)
  const [venueFormValues, setVenueFormValues] = useState(createVenueFormValues())

  useEffect(() => {
    let isMounted = true

    async function loadVenueDetails() {
      setStatus('loading')
      setError('')
      setSaveMessage('')

      try {
        const venue = await partnerApi.getVenue(selectedVenue.id)

        if (!isMounted) {
          return
        }

        setVenueFormValues(createVenueFormValues(venue))
        setCoordinatePreview(
          venue.address?.latitude != null && venue.address?.longitude != null
            ? {
                latitude: venue.address.latitude,
                longitude: venue.address.longitude,
                displayName: `${venue.address.city || '-'}, ${venue.address.street || '-'}`,
              }
            : null,
        )
        setStatus('ready')
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        setError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac szczegolow obiektu.')
        setStatus('error')
      }
    }

    void loadVenueDetails()

    return () => {
      isMounted = false
    }
  }, [selectedVenue.id])

  function handleVenueChange(event) {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value

    setVenueFormValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [name]: nextValue,
      }

      if (['street', 'city', 'postalCode', 'voivodeship'].includes(name)) {
        nextValues.latitude = ''
        nextValues.longitude = ''
      }

      return nextValues
    })

    if (['street', 'city', 'postalCode', 'voivodeship'].includes(name)) {
      setCoordinatePreview(null)
    }
  }

  async function handleResolveCoordinates() {
    const addressFields = ['street', 'city', 'postalCode', 'voivodeship']
    const hasCompleteAddress = addressFields.every((fieldName) => venueFormValues[fieldName]?.trim())

    if (!hasCompleteAddress) {
      setError('Uzupelnij ulice, miasto, kod pocztowy i wojewodztwo przed pobraniem wspolrzednych.')
      return
    }

    setIsGeocodingAddress(true)
    setError('')
    setSaveMessage('')

    try {
      const match = await geocodingApi.getCoordinatesFromAddress({
        street: venueFormValues.street.trim(),
        city: venueFormValues.city.trim(),
        postalCode: venueFormValues.postalCode.trim(),
        voivodeship: venueFormValues.voivodeship.trim(),
      })

      setVenueFormValues((currentValues) => ({
        ...currentValues,
        latitude: String(match.latitude),
        longitude: String(match.longitude),
      }))
      setCoordinatePreview(match)
    } catch (requestError) {
      setCoordinatePreview(null)
      setError(requestError.response?.data?.message ?? requestError.message ?? 'Nie udalo sie pobrac wspolrzednych.')
    } finally {
      setIsGeocodingAddress(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!venueFormValues.latitude || !venueFormValues.longitude) {
      setError('Najpierw pobierz wspolrzedne z adresu.')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSaveMessage('')

    try {
      const updatedVenue = await partnerApi.updateVenue(selectedVenue.id, buildVenuePayload(venueFormValues))
      setVenueFormValues(createVenueFormValues(updatedVenue))
      setCoordinatePreview(
        updatedVenue.address?.latitude != null && updatedVenue.address?.longitude != null
          ? {
              latitude: updatedVenue.address.latitude,
              longitude: updatedVenue.address.longitude,
              displayName: `${updatedVenue.address.city || '-'}, ${updatedVenue.address.street || '-'}`,
            }
          : null,
      )
      setSaveMessage(
        updatedVenue.status === 'APPROVED'
          ? 'Zmiany zostaly zapisane.'
          : 'Zmiany zostaly zapisane. Obiekt wrocil do statusu oczekujacego na review admina.',
      )
      onVenueUpdated(updatedVenue)
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie zapisac zmian obiektu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <section className="partner-dashboard__workspace">
        <p className="partner-dashboard__empty">Ladowanie danych obiektu...</p>
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className="partner-dashboard__workspace">
        <div className="partner-dashboard__placeholder-panel">
          <strong>Nie udalo sie pobrac obiektu</strong>
          <span>{error}</span>
        </div>
      </section>
    )
  }

  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Obiekt</span>
          <h2>{selectedVenue.name} - Edycja</h2>
          <p>Edytujesz zatwierdzony obiekt. Po zapisie jego status moze wrocic do oczekiwania na review.</p>
        </div>
      </div>

      {error ? <p className="partner-dashboard__error">{error}</p> : null}
      {saveMessage ? <p className="partner-dashboard__notice">{saveMessage}</p> : null}

      <form className="partner-dashboard__form" onSubmit={handleSubmit}>
        <VenueFormFields
          venueFormValues={venueFormValues}
          onVenueChange={handleVenueChange}
          onResolveCoordinates={handleResolveCoordinates}
          isGeocodingAddress={isGeocodingAddress}
          coordinatePreview={coordinatePreview}
        />

        <button
          type="submit"
          className="partner-dashboard__submit"
          disabled={isSubmitting || isGeocodingAddress || !venueFormValues.latitude || !venueFormValues.longitude}
        >
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </button>
      </form>

      <VenueImagesManager venueId={selectedVenue.id} />
    </section>
  )
}

export default EditVenueView
