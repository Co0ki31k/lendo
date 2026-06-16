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
import { buildVenuePayload } from './dashboard/venueForm.js'
import './PartnerDashboardPage.css'

const INITIAL_VENUE_LIST_QUERY = {
  page: 0,
  size: 8,
  search: '',
  status: 'all',
  sortBy: 'createdAt',
  sortDir: 'desc',
}

const EMPTY_VENUE_PAGE = {
  items: [],
  page: {
    page: 0,
    size: 8,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  summary: {
    total: 0,
    pending: 0,
    approved: 0,
    draft: 0,
    rejected: 0,
  },
}

function buildVenueListParams(query) {
  return {
    page: query.page,
    size: query.size,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    ...(query.search.trim() ? { search: query.search.trim() } : {}),
    ...(query.status !== 'all' ? { status: query.status } : {}),
  }
}

function PartnerDashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [venueData, setVenueData] = useState(EMPTY_VENUE_PAGE)
  const [selectedVenueId, setSelectedVenueId] = useState(null)
  const [venueFormValues, setVenueFormValues] = useState(INITIAL_VENUE_FORM_VALUES)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isVenueSubmitting, setIsVenueSubmitting] = useState(false)
  const [managerView, setManagerView] = useState('stats')
  const [objectView, setObjectView] = useState('calendar')
  const [venueQuery, setVenueQuery] = useState(INITIAL_VENUE_LIST_QUERY)

  const loadVenueList = useCallback(async (query, { silent = false } = {}) => {
    if (!silent) {
      setStatus('loading')
      setError('')
      setNotice('')
    }

    try {
      const venuesResponse = await partnerApi.getOwnVenues(buildVenueListParams(query))
      setVenueData(venuesResponse)
      setSelectedVenueId((currentSelectedVenueId) => {
        const nextActionableVenues = venuesResponse.items.filter((venue) => ['APPROVED', 'DRAFT'].includes(venue.status))

        if (currentSelectedVenueId && nextActionableVenues.some((venue) => venue.id === currentSelectedVenueId)) {
          return currentSelectedVenueId
        }

        return nextActionableVenues[0]?.id ?? null
      })
      setStatus('ready')
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac listy obiektow managera.')
      setStatus('error')
    }
  }, [])

  const loadDashboardData = useCallback(async () => {
    setStatus('loading')
    setError('')
    setNotice('')

    try {
      const [profileResponse, venuesResponse] = await Promise.all([
        partnerApi.getPartnerProfile(),
        partnerApi.getOwnVenues(buildVenueListParams(venueQuery)),
      ])
      setProfile(profileResponse)
      setVenueData(venuesResponse)
      setSelectedVenueId((currentSelectedVenueId) => {
        const nextActionableVenues = venuesResponse.items.filter((venue) => ['APPROVED', 'DRAFT'].includes(venue.status))

        if (currentSelectedVenueId && nextActionableVenues.some((venue) => venue.id === currentSelectedVenueId)) {
          return currentSelectedVenueId
        }

        return nextActionableVenues[0]?.id ?? null
      })
      setStatus('ready')
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac dashboardu managera.')
      setStatus('error')
    }
  }, [venueQuery])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboardData()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadDashboardData])

  const actionableVenues = useMemo(
    () => venueData.items.filter((venue) => ['APPROVED', 'DRAFT'].includes(venue.status)),
    [venueData.items],
  )

  const actionableVenueIds = useMemo(
    () => actionableVenues.map((venue) => venue.id),
    [actionableVenues],
  )

  const selectedVenue = useMemo(
    () => actionableVenues.find((venue) => venue.id === selectedVenueId) ?? null,
    [actionableVenues, selectedVenueId],
  )

  const accountName = useMemo(() => buildAccountName(user), [user])

  function handleVenueChange(event) {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value

    setVenueFormValues((currentValues) => ({
      ...currentValues,
      [name]: nextValue,
    }))
  }

  async function handleVenueSubmit(event) {
    event.preventDefault()

    setIsVenueSubmitting(true)
    setError('')
    setNotice('')

    try {
      const createdVenue = await partnerApi.createVenue(buildVenuePayload(venueFormValues))
      if (createdVenue.status === 'APPROVED') {
        setSelectedVenueId(createdVenue.id)
      } else {
        setNotice('Obiekt zostal utworzony i oczekuje teraz na review admina.')
      }
      setVenueFormValues(INITIAL_VENUE_FORM_VALUES)
      setManagerView('select')
      void loadVenueList(venueQuery, { silent: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie dodac obiektu. Sprawdz, czy adres jest poprawny.')
    } finally {
      setIsVenueSubmitting(false)
    }
  }

  function handleVenueUpdated(updatedVenue) {
    if (updatedVenue.deleted) {
      const nextVenues = venueData.items.filter((venue) => venue.id !== updatedVenue.id)
      const nextActionableVenue = nextVenues.find((venue) => ['APPROVED', 'DRAFT'].includes(venue.status))

      setSelectedVenueId(nextActionableVenue?.id ?? null)
      setManagerView('select')
      setNotice('Obiekt zostal usuniety.')
      void loadVenueList(venueQuery, { silent: true })
      return
    }

    const nextVenues = venueData.items.map((venue) => (
      venue.id === updatedVenue.id ? updatedVenue : venue
    ))

    void loadVenueList(venueQuery, { silent: true })

    if (updatedVenue.status === 'APPROVED') {
      setSelectedVenueId(updatedVenue.id)
      setNotice('Zmiany w obiekcie zostaly zapisane.')
      return
    }

    if (updatedVenue.status === 'DRAFT') {
      setSelectedVenueId(updatedVenue.id)
      setManagerView('object')
      setObjectView('edit')
      setNotice('Zmiany zostaly zapisane. Obiekt jest gotowy do ponownego wyslania po poprawkach.')
      return
    }

    const nextActionableVenue = nextVenues.find((venue) => ['APPROVED', 'DRAFT'].includes(venue.status) && venue.id !== updatedVenue.id)
    setSelectedVenueId(nextActionableVenue?.id ?? null)
    setManagerView('select')
    setNotice('Obiekt zostal wyslany ponownie do review i nie jest juz aktywnym obiektem dashboardu.')
  }

  function handleVenueQueryChange(patch) {
    setError('')
    setVenueQuery((current) => ({
      ...current,
      ...patch,
    }))
  }

  function renderWorkspace() {
    if (managerView === 'stats') {
      return <StatsView summary={venueData.summary} />
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
          venues={venueData.items}
          actionableVenueIds={actionableVenueIds}
          selectedVenueId={selectedVenueId}
          venueQuery={venueQuery}
          pageMeta={venueData.page}
          onVenueSelect={setSelectedVenueId}
          onVenueQueryChange={handleVenueQueryChange}
          onRefresh={() => void loadVenueList(venueQuery, { silent: true })}
        />
      )
    }

    return (
      <ObjectWorkspaceView
        selectedVenue={selectedVenue}
        objectView={objectView}
        onVenueUpdated={handleVenueUpdated}
      />
    )
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
        {notice ? <p className="partner-dashboard__notice">{notice}</p> : null}

        <div className="partner-dashboard__layout">
          <PartnerDashboardSidebar
            selectedVenue={selectedVenue}
            hasSelectedVenue={Boolean(selectedVenue)}
            hasApprovedVenue={selectedVenue?.status === 'APPROVED'}
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
