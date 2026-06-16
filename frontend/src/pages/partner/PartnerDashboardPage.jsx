import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { partnerApi } from '../../api'
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
        if (currentSelectedVenueId && venuesResponse.some((venue) => venue.id === currentSelectedVenueId)) {
          return currentSelectedVenueId
        }

        return venuesResponse[0]?.id ?? null
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

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedVenueId) ?? null,
    [selectedVenueId, venues],
  )

  const accountName = useMemo(() => buildAccountName(user), [user])

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
      setSelectedVenueId(createdVenue.id)
      setVenueFormValues(INITIAL_VENUE_FORM_VALUES)
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
          isVenueSubmitting={isVenueSubmitting}
        />
      )
    }

    if (managerView === 'select') {
      return (
        <SelectVenueView
          venues={venues}
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
