import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { geocodingApi, partnerApi } from '../../api'
import { useAuth } from '../../features/auth'
import CreateVenueView from './dashboard/CreateVenueView.jsx'
import ObjectWorkspaceView from './dashboard/ObjectWorkspaceView.jsx'
import PartnerDashboardHeader from './dashboard/PartnerDashboardHeader.jsx'
import PartnerDashboardSidebar from './dashboard/PartnerDashboardSidebar.jsx'
import SelectVenueView from './dashboard/SelectVenueView.jsx'
import StatsView from './dashboard/StatsView.jsx'
import { INITIAL_VENUE_FORM_VALUES } from './dashboard/constants.js'
import { buildAccountName } from './dashboard/utils.js'
import './PartnerDashboardPage.css'

function PartnerDashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [venues, setVenues] = useState([])
  const [selectedVenueId, setSelectedVenueId] = useState(null)
  const [venueFormValues, setVenueFormValues] = useState(INITIAL_VENUE_FORM_VALUES)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [isVenueSubmitting, setIsVenueSubmitting] = useState(false)
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false)
  const [coordinatePreview, setCoordinatePreview] = useState(null)
  const [managerView, setManagerView] = useState('stats')
  const [objectView, setObjectView] = useState('calendar')

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
      setSelectedVenueId((currentSelectedVenueId) => {
        const nextApprovedVenues = venuesResponse.filter((venue) => venue.status === 'APPROVED')

        if (currentSelectedVenueId && nextApprovedVenues.some((venue) => venue.id === currentSelectedVenueId)) {
          return currentSelectedVenueId
        }

        return nextApprovedVenues[0]?.id ?? null
      })
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

  const approvedVenues = useMemo(
    () => venues.filter((venue) => venue.status === 'APPROVED'),
    [venues],
  )

  const approvedVenueIds = useMemo(
    () => approvedVenues.map((venue) => venue.id),
    [approvedVenues],
  )

  const selectedVenue = useMemo(
    () => approvedVenues.find((venue) => venue.id === selectedVenueId) ?? null,
    [approvedVenues, selectedVenueId],
  )

  const accountName = useMemo(() => buildAccountName(user), [user])

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

  async function handleResolveCoordinates() {
    const addressFields = ['street', 'city', 'postalCode', 'voivodeship']
    const hasCompleteAddress = addressFields.every((fieldName) => venueFormValues[fieldName]?.trim())

    if (!hasCompleteAddress) {
      setError('Uzupelnij ulice, miasto, kod pocztowy i wojewodztwo przed pobraniem wspolrzednych.')
      return
    }

    setIsGeocodingAddress(true)
    setError('')

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

  async function handleVenueSubmit(event) {
    event.preventDefault()

    if (!venueFormValues.latitude || !venueFormValues.longitude) {
      setError('Najpierw pobierz wspolrzedne z adresu.')
      return
    }

    setIsVenueSubmitting(true)
    setError('')

    try {
      const createdVenue = await partnerApi.createVenue(buildVenuePayload())
      setVenues((currentVenues) => [createdVenue, ...currentVenues])
      if (createdVenue.status === 'APPROVED') {
        setSelectedVenueId(createdVenue.id)
      }
      setVenueFormValues(INITIAL_VENUE_FORM_VALUES)
      setCoordinatePreview(null)
      setManagerView('select')
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie dodac obiektu.')
    } finally {
      setIsVenueSubmitting(false)
    }
  }

  function renderWorkspace() {
    if (managerView === 'stats') {
      return <StatsView venues={venues} />
    }

    if (managerView === 'create') {
      return (
        <CreateVenueView
          venueFormValues={venueFormValues}
          onVenueChange={handleVenueChange}
          onVenueSubmit={handleVenueSubmit}
          onResolveCoordinates={handleResolveCoordinates}
          isVenueSubmitting={isVenueSubmitting}
          isGeocodingAddress={isGeocodingAddress}
          coordinatePreview={coordinatePreview}
          isAddressResolved={Boolean(venueFormValues.latitude && venueFormValues.longitude)}
        />
      )
    }

    if (managerView === 'select') {
      return (
        <SelectVenueView
          venues={venues}
          approvedVenueIds={approvedVenueIds}
          selectedVenueId={selectedVenueId}
          onVenueSelect={setSelectedVenueId}
          onRefresh={() => void loadDashboardData()}
        />
      )
    }

    return <ObjectWorkspaceView selectedVenue={selectedVenue} objectView={objectView} />
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
        <PartnerDashboardHeader accountName={accountName} />

        {error ? <p className="partner-dashboard__error">{error}</p> : null}

        <div className="partner-dashboard__layout">
          <PartnerDashboardSidebar
            selectedVenue={selectedVenue}
            hasApprovedVenue={Boolean(selectedVenue)}
            managerView={managerView}
            objectView={objectView}
            onManagerViewChange={setManagerView}
            onObjectViewChange={(nextObjectView) => {
              setManagerView('object')
              setObjectView(nextObjectView)
            }}
          />

          {renderWorkspace()}
        </div>
      </section>
    </main>
  )
}

export default PartnerDashboardPage
