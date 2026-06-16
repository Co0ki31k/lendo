import { useEffect, useState } from 'react'
import { partnerApi } from '../../../api'
import VenueFormFields from './VenueFormFields.jsx'
import { buildVenuePayload, createVenueFormValues } from './venueForm.js'

function EditVenueView({ selectedVenue, onVenueUpdated }) {
  const editFormId = `venue-edit-form-${selectedVenue.id}`
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      return {
        ...currentValues,
        [name]: nextValue,
      }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setIsSubmitting(true)
    setError('')
    setSaveMessage('')

    try {
      const updatedVenue = await partnerApi.updateVenue(selectedVenue.id, buildVenuePayload(venueFormValues))
      setVenueFormValues(createVenueFormValues(updatedVenue))
      setSaveMessage(
        updatedVenue.status === 'APPROVED'
          ? 'Zmiany zostaly zapisane.'
          : 'Zmiany zostaly zapisane. Obiekt wrocil do statusu oczekujacego na review admina.',
      )
      onVenueUpdated(updatedVenue)
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie zapisac zmian obiektu. Sprawdz, czy adres jest poprawny.')
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

      <form id={editFormId} className="partner-dashboard__form" onSubmit={handleSubmit}>
        <VenueFormFields venueFormValues={venueFormValues} onVenueChange={handleVenueChange} />
      </form>

      <div className="partner-dashboard__edit-actions">
        <button
          type="submit"
          form={editFormId}
          className="partner-dashboard__submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </button>
      </div>
    </section>
  )
}

export default EditVenueView
