import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../api'
import './AdminPage.css'

const VENUE_STATUS_LABELS = {
  PENDING: 'Oczekuje',
  APPROVED: 'Zaakceptowany',
  REJECTED: 'Odrzucony',
  DRAFT: 'Do poprawy',
}

const INITIAL_PARTNER_QUERY = {
  page: 0,
  size: 10,
  search: '',
  verified: 'all',
  sortBy: 'createdAt',
  sortDir: 'desc',
}

const INITIAL_VENUE_QUERY = {
  page: 0,
  size: 8,
  search: '',
  status: 'all',
  sortBy: 'createdAt',
  sortDir: 'desc',
}

const EMPTY_PAGE = {
  page: 0,
  size: 0,
  totalItems: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
}

const EMPTY_PARTNER_RESPONSE = {
  items: [],
  page: EMPTY_PAGE,
  summary: {
    total: 0,
    verified: 0,
    pending: 0,
  },
}

const EMPTY_VENUE_RESPONSE = {
  items: [],
  page: EMPTY_PAGE,
  summary: {
    total: 0,
    pending: 0,
    approved: 0,
    draft: 0,
    rejected: 0,
  },
}

const INITIAL_USER_QUERY = {
  page: 0,
  size: 10,
  search: '',
  role: 'all',
  sortBy: 'createdAt',
  sortDir: 'desc',
}

const EMPTY_USER_RESPONSE = {
  items: [],
  page: EMPTY_PAGE,
  summary: {
    total: 0,
    users: 0,
    admins: 0,
  },
}

const USER_ROLE_LABELS = {
  CLIENT: 'User',
  ADMIN: 'Admin',
}

const INGREDIENT_CATEGORY_LABELS = {
  MIESO: 'Mieso',
  NABIAL: 'Nabial',
  WARZYWA_OWOCE: 'Warzywa i owoce',
  SUCHE: 'Suche',
}

const UNIT_LABELS = {
  G: 'g',
  ML: 'ml',
  SZT: 'szt.',
}

const EMPTY_INGREDIENT_FORM = {
  name: '',
  category: 'MIESO',
  defaultUnit: 'G',
  wastePercentage: '0.00',
}

function formatWastePercentage(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '-'
  }

  return `${Math.round(Number(value) * 100)}%`
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

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

function buildPartnerParams(query) {
  return {
    page: query.page,
    size: query.size,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    ...(query.search.trim() ? { search: query.search.trim() } : {}),
    ...(query.verified !== 'all' ? { verified: query.verified === 'verified' } : {}),
  }
}

function buildVenueParams(query) {
  return {
    page: query.page,
    size: query.size,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    ...(query.search.trim() ? { search: query.search.trim() } : {}),
    ...(query.status !== 'all' ? { status: query.status } : {}),
  }
}

function buildUserParams(query) {
  return {
    page: query.page,
    size: query.size,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    ...(query.search.trim() ? { search: query.search.trim() } : {}),
    ...(query.role !== 'all' ? { role: query.role } : {}),
  }
}

function PaginationControls({ page, onPageChange }) {
  return (
    <div className="admin-dashboard__pagination">
      <button
        type="button"
        className="admin-dashboard__secondary-action"
        onClick={() => onPageChange(page.page - 1)}
        disabled={!page.hasPrevious}
      >
        Poprzednia
      </button>
      <span className="admin-dashboard__pagination-label">
        Strona {page.totalPages === 0 ? 0 : page.page + 1} z {page.totalPages}
      </span>
      <button
        type="button"
        className="admin-dashboard__secondary-action"
        onClick={() => onPageChange(page.page + 1)}
        disabled={!page.hasNext}
      >
        Nastepna
      </button>
    </div>
  )
}

function AdminPage() {
  const [adminView, setAdminView] = useState('stats')
  const [partnerQuery, setPartnerQuery] = useState(INITIAL_PARTNER_QUERY)
  const [venueQuery, setVenueQuery] = useState(INITIAL_VENUE_QUERY)
  const [userQuery, setUserQuery] = useState(INITIAL_USER_QUERY)
  const [partnerData, setPartnerData] = useState(EMPTY_PARTNER_RESPONSE)
  const [venueData, setVenueData] = useState(EMPTY_VENUE_RESPONSE)
  const [userData, setUserData] = useState(EMPTY_USER_RESPONSE)
  const [adminStats, setAdminStats] = useState({
    partners: EMPTY_PARTNER_RESPONSE.summary,
    venues: EMPTY_VENUE_RESPONSE.summary,
    users: EMPTY_USER_RESPONSE.summary,
  })
  const [ingredients, setIngredients] = useState([])
  const [ingredientSearch, setIngredientSearch] = useState('')
  const [ingredientCategoryFilter, setIngredientCategoryFilter] = useState('all')
  const [ingredientForm, setIngredientForm] = useState(EMPTY_INGREDIENT_FORM)
  const [editingIngredientId, setEditingIngredientId] = useState(null)
  const [isLoadingPartners, setIsLoadingPartners] = useState(true)
  const [isLoadingVenues, setIsLoadingVenues] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(true)
  const [error, setError] = useState('')
  const [activeRequests, setActiveRequests] = useState({})
  const [expandedVenues, setExpandedVenues] = useState({})
  const [expandedPartners, setExpandedPartners] = useState({})
  const [expandedUsers, setExpandedUsers] = useState({})
  const [venueComments, setVenueComments] = useState({})
  const [commentEditors, setCommentEditors] = useState({})

  const loadPartners = useCallback(async (query) => {
    setIsLoadingPartners(true)

    try {
      const response = await adminApi.getPartners(buildPartnerParams(query))
      setPartnerData(response)
    } catch (loadError) {
      setError(loadError.response?.data?.message ?? 'Nie udalo sie pobrac listy partnerow.')
    } finally {
      setIsLoadingPartners(false)
    }
  }, [])

  const loadVenues = useCallback(async (query) => {
    setIsLoadingVenues(true)

    try {
      const response = await adminApi.getVenues(buildVenueParams(query))
      setVenueData(response)
      setVenueComments((current) => ({
        ...Object.fromEntries(response.items.map((venue) => [venue.id, venue.adminReviewComment ?? ''])),
        ...current,
      }))
    } catch (loadError) {
      setError(loadError.response?.data?.message ?? 'Nie udalo sie pobrac listy obiektow.')
    } finally {
      setIsLoadingVenues(false)
    }
  }, [])

  const loadUsers = useCallback(async (query) => {
    setIsLoadingUsers(true)

    try {
      const response = await adminApi.getUsers(buildUserParams(query))
      setUserData(response)
    } catch (loadError) {
      setError(loadError.response?.data?.message ?? 'Nie udalo sie pobrac listy uzytkownikow.')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  const loadIngredients = useCallback(async () => {
    setIsLoadingIngredients(true)

    try {
      const response = await adminApi.getIngredients()
      setIngredients(response)
    } catch (loadError) {
      setError(loadError.response?.data?.message ?? 'Nie udalo sie pobrac listy skladnikow.')
    } finally {
      setIsLoadingIngredients(false)
    }
  }, [])

  const loadAdminStats = useCallback(async () => {
    try {
      const [partnersResponse, venuesResponse, usersResponse] = await Promise.all([
        adminApi.getPartners({ page: 0, size: 1, sortBy: 'createdAt', sortDir: 'desc' }),
        adminApi.getVenues({ page: 0, size: 1, sortBy: 'createdAt', sortDir: 'desc' }),
        adminApi.getUsers({ page: 0, size: 1, sortBy: 'createdAt', sortDir: 'desc' }),
      ])

      setAdminStats({
        partners: partnersResponse.summary,
        venues: venuesResponse.summary,
        users: usersResponse.summary,
      })
    } catch (loadError) {
      setError(loadError.response?.data?.message ?? 'Nie udalo sie pobrac statystyk admina.')
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPartners(partnerQuery)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadPartners, partnerQuery])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadVenues(venueQuery)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadVenues, venueQuery])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAdminStats()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadAdminStats])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadUsers(userQuery)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadUsers, userQuery])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadIngredients()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadIngredients])

  useEffect(() => {
    if (!error) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setError('')
    }, 5000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [error])

  const partnerStats = partnerData.summary
  const partners = partnerData.items
  const venues = venueData.items
  const users = userData.items

  function resetError() {
    setError('')
  }

  function updatePartnerQuery(patch) {
    resetError()
    setPartnerQuery((current) => ({
      ...current,
      ...patch,
    }))
  }

  function updateVenueQuery(patch) {
    resetError()
    setVenueQuery((current) => ({
      ...current,
      ...patch,
    }))
  }

  function updateUserQuery(patch) {
    resetError()
    setUserQuery((current) => ({
      ...current,
      ...patch,
    }))
  }

  function handleRefresh() {
    resetError()
    void Promise.all([
      loadAdminStats(),
      loadPartners(partnerQuery),
      loadVenues(venueQuery),
      loadUsers(userQuery),
      loadIngredients(),
    ])
  }

  async function handlePartnerVerification(userId, verified) {
    const requestKey = `partner:${userId}`
    setActiveRequests((current) => ({ ...current, [requestKey]: true }))

    try {
      await adminApi.updatePartnerVerification(userId, verified)
      await Promise.all([loadPartners(partnerQuery), loadAdminStats()])
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie zaktualizowac weryfikacji partnera.')
    } finally {
      setActiveRequests((current) => ({ ...current, [requestKey]: false }))
    }
  }

  async function handlePartnerDelete(userId) {
    const requestKey = `partner-delete:${userId}`
    setActiveRequests((current) => ({ ...current, [requestKey]: true }))

    try {
      await adminApi.deletePartner(userId)
      await Promise.all([loadPartners(partnerQuery), loadAdminStats()])
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie usunac partnera.')
    } finally {
      setActiveRequests((current) => ({ ...current, [requestKey]: false }))
    }
  }

  async function handleVenueStatusUpdate(venueId, status) {
    const requestKey = `venue:${venueId}:${status}`
    setActiveRequests((current) => ({ ...current, [requestKey]: true }))

    try {
      const updatedVenue = await adminApi.updateVenueStatus(venueId, status, venueComments[venueId] ?? '')
      setVenueData((current) => ({
        ...current,
        items: current.items.map((venue) => (venue.id === venueId ? updatedVenue : venue)),
      }))
      setVenueComments((current) => ({
        ...current,
        [venueId]: updatedVenue.adminReviewComment ?? '',
      }))
      setCommentEditors((current) => ({
        ...current,
        [venueId]: false,
      }))
      await Promise.all([loadVenues(venueQuery), loadAdminStats()])
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie zaktualizowac statusu obiektu.')
    } finally {
      setActiveRequests((current) => ({ ...current, [requestKey]: false }))
    }
  }

  async function handleVenueDelete(venueId) {
    const requestKey = `venue-delete:${venueId}`
    setActiveRequests((current) => ({ ...current, [requestKey]: true }))

    try {
      await adminApi.deleteVenue(venueId)
      await Promise.all([loadVenues(venueQuery), loadAdminStats()])
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie usunac obiektu.')
    } finally {
      setActiveRequests((current) => ({ ...current, [requestKey]: false }))
    }
  }

  async function handleUserRoleUpdate(userId, role) {
    const requestKey = `user-role:${userId}`
    setActiveRequests((current) => ({ ...current, [requestKey]: true }))

    try {
      await adminApi.updateUserRole(userId, role)
      await Promise.all([loadUsers(userQuery), loadAdminStats()])
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie zmienic roli uzytkownika.')
    } finally {
      setActiveRequests((current) => ({ ...current, [requestKey]: false }))
    }
  }

  async function handleUserDelete(userId) {
    const requestKey = `user-delete:${userId}`
    setActiveRequests((current) => ({ ...current, [requestKey]: true }))

    try {
      await adminApi.deleteUser(userId)
      await Promise.all([loadUsers(userQuery), loadAdminStats()])
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie usunac uzytkownika.')
    } finally {
      setActiveRequests((current) => ({ ...current, [requestKey]: false }))
    }
  }

  async function handleIngredientSubmit(event) {
    event.preventDefault()
    const requestKey = editingIngredientId == null ? 'ingredient-create' : `ingredient-update:${editingIngredientId}`
    setActiveRequests((current) => ({ ...current, [requestKey]: true }))

    try {
      const payload = {
        name: ingredientForm.name.trim(),
        category: ingredientForm.category,
        defaultUnit: ingredientForm.defaultUnit,
        wastePercentage: Number(ingredientForm.wastePercentage),
      }

      if (editingIngredientId == null) {
        await adminApi.createIngredient(payload)
      } else {
        await adminApi.updateIngredient(editingIngredientId, payload)
      }

      setIngredientForm(EMPTY_INGREDIENT_FORM)
      setEditingIngredientId(null)
      await loadIngredients()
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie zapisac skladnika.')
    } finally {
      setActiveRequests((current) => ({ ...current, [requestKey]: false }))
    }
  }

  async function handleIngredientDelete(ingredientId) {
    const requestKey = `ingredient-delete:${ingredientId}`
    setActiveRequests((current) => ({ ...current, [requestKey]: true }))

    try {
      await adminApi.deleteIngredient(ingredientId)
      if (editingIngredientId === ingredientId) {
        setEditingIngredientId(null)
        setIngredientForm(EMPTY_INGREDIENT_FORM)
      }
      await loadIngredients()
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie usunac skladnika.')
    } finally {
      setActiveRequests((current) => ({ ...current, [requestKey]: false }))
    }
  }

  function startIngredientEdit(ingredient) {
    setEditingIngredientId(ingredient.id)
    setIngredientForm({
      name: ingredient.name,
      category: ingredient.category,
      defaultUnit: ingredient.defaultUnit,
      wastePercentage: Number(ingredient.wastePercentage).toFixed(2),
    })
    resetError()
  }

  function resetIngredientForm() {
    setEditingIngredientId(null)
    setIngredientForm(EMPTY_INGREDIENT_FORM)
    resetError()
  }

  function toggleVenueDetails(venueId) {
    setExpandedVenues((current) => ({
      ...current,
      [venueId]: !current[venueId],
    }))
  }

  function togglePartnerDetails(userId) {
    setExpandedPartners((current) => ({
      ...current,
      [userId]: !current[userId],
    }))
  }

  function toggleUserDetails(userId) {
    setExpandedUsers((current) => ({
      ...current,
      [userId]: !current[userId],
    }))
  }

  function handleVenueCommentChange(venueId, value) {
    setVenueComments((current) => ({
      ...current,
      [venueId]: value,
    }))
  }

  function toggleCommentEditor(venueId) {
    setCommentEditors((current) => ({
      ...current,
      [venueId]: !current[venueId],
    }))
  }

  const venueStatusOptions = useMemo(() => [
    { value: 'all', label: 'Wszystkie statusy' },
    { value: 'PENDING', label: 'Oczekujace' },
    { value: 'DRAFT', label: 'Do poprawy' },
    { value: 'APPROVED', label: 'Zaakceptowane' },
    { value: 'REJECTED', label: 'Odrzucone' },
  ], [])

  const filteredIngredients = useMemo(() => {
    const normalizedSearch = ingredientSearch.trim().toLowerCase()

    return ingredients.filter((ingredient) => {
      const matchesCategory = ingredientCategoryFilter === 'all' || ingredient.category === ingredientCategoryFilter
      const matchesSearch = !normalizedSearch || ingredient.name.toLowerCase().includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
  }, [ingredientCategoryFilter, ingredientSearch, ingredients])

  function renderPartnerView() {
    return (
      <section className="admin-dashboard__workspace">
        <div className="admin-dashboard__workspace-header">
          <div>
            <span className="admin-dashboard__workspace-eyebrow">Partnerzy</span>
            <h2>Weryfikacja partnerow</h2>
            <p>Filtrowanie, sortowanie i decyzje dla kont partnerow.</p>
          </div>
        </div>

        <div className="admin-dashboard__stats-grid">
          <article className="admin-dashboard__stat-card">
            <span>Wszystkie profile</span>
            <strong>{partnerStats.total}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>Zweryfikowane</span>
            <strong>{partnerStats.verified}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>Oczekujace</span>
            <strong>{partnerStats.pending}</strong>
          </article>
        </div>

        <div className="admin-dashboard__toolbar">
          <input
            type="search"
            className="admin-dashboard__input"
            value={partnerQuery.search}
            onChange={(event) => updatePartnerQuery({ search: event.target.value, page: 0 })}
            placeholder="Szukaj po firmie, emailu lub NIP"
          />
          <select
            className="admin-dashboard__select"
            value={partnerQuery.verified}
            onChange={(event) => updatePartnerQuery({ verified: event.target.value, page: 0 })}
          >
            <option value="all">Wszystkie statusy</option>
            <option value="verified">Zweryfikowani</option>
            <option value="pending">Oczekujacy</option>
          </select>
          <select
            className="admin-dashboard__select"
            value={partnerQuery.sortBy}
            onChange={(event) => updatePartnerQuery({ sortBy: event.target.value, page: 0 })}
          >
            <option value="createdAt">Sortuj: data</option>
            <option value="companyName">Sortuj: firma</option>
            <option value="verified">Sortuj: status</option>
          </select>
          <select
            className="admin-dashboard__select"
            value={partnerQuery.sortDir}
            onChange={(event) => updatePartnerQuery({ sortDir: event.target.value, page: 0 })}
          >
            <option value="desc">Malejaco</option>
            <option value="asc">Rosnaco</option>
          </select>
          <select
            className="admin-dashboard__select"
            value={partnerQuery.size}
            onChange={(event) => updatePartnerQuery({ size: Number(event.target.value), page: 0 })}
          >
            <option value="10">10 / strona</option>
            <option value="20">20 / strona</option>
            <option value="50">50 / strona</option>
          </select>
        </div>

        {isLoadingPartners ? (
          <p className="admin-dashboard__empty">Ladowanie partnerow...</p>
        ) : partners.length === 0 ? (
          <p className="admin-dashboard__empty">Brak partnerow dla wybranych filtrow.</p>
        ) : (
          <>
            <div className="admin-dashboard__partner-list">
              {partners.map((partner) => {
                const requestKey = `partner:${partner.userId}`
                const deleteRequestKey = `partner-delete:${partner.userId}`
                const isSubmitting = Boolean(activeRequests[requestKey])
                const isDeleting = Boolean(activeRequests[deleteRequestKey])
                const isExpanded = Boolean(expandedPartners[partner.userId])

                return (
                  <article key={partner.userId} className="admin-dashboard__partner-card">
                    <div className="admin-dashboard__partner-top">
                      <div className="admin-dashboard__partner-summary">
                        <h3>{partner.companyName || `${partner.firstName} ${partner.lastName}`}</h3>
                        <p>{partner.firstName} {partner.lastName}</p>
                      </div>

                      <span className={`admin-dashboard__status-badge ${partner.verified ? 'admin-dashboard__status-badge--approved' : 'admin-dashboard__status-badge--pending'}`}>
                        {partner.verified ? 'Zweryfikowany' : 'Oczekuje'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="admin-dashboard__details-toggle"
                      onClick={() => togglePartnerDetails(partner.userId)}
                    >
                      {isExpanded ? 'Ukryj szczegoly partnera' : 'Pokaz szczegoly partnera'}
                    </button>

                    {isExpanded ? (
                      <section className="admin-dashboard__details" aria-label="Szczegoly partnera">
                        <dl className="admin-dashboard__details-grid">
                          <div>
                            <dt>Email konta</dt>
                            <dd>{partner.email || '-'}</dd>
                          </div>
                          <div>
                            <dt>Email kontaktowy</dt>
                            <dd>{partner.contactEmail || '-'}</dd>
                          </div>
                          <div>
                            <dt>Telefon</dt>
                            <dd>{partner.phoneNumber || '-'}</dd>
                          </div>
                          <div>
                            <dt>NIP</dt>
                            <dd>{partner.taxId || '-'}</dd>
                          </div>
                          <div>
                            <dt>Utworzono</dt>
                            <dd>{formatDateTime(partner.createdAt)}</dd>
                          </div>
                        </dl>
                      </section>
                    ) : null}

                    <div className="admin-dashboard__actions">
                      <button
                        type="button"
                        className="admin-dashboard__action admin-dashboard__action--approve"
                        disabled={isSubmitting || isDeleting || partner.verified}
                        onClick={() => handlePartnerVerification(partner.userId, true)}
                      >
                        Potwierdz
                      </button>
                      <button
                        type="button"
                        className="admin-dashboard__action admin-dashboard__action--reject"
                        disabled={isSubmitting || isDeleting || !partner.verified}
                        onClick={() => handlePartnerVerification(partner.userId, false)}
                      >
                        Cofnij
                      </button>
                      <button
                        type="button"
                        className="admin-dashboard__action admin-dashboard__action--reject"
                        disabled={isSubmitting || isDeleting}
                        onClick={() => handlePartnerDelete(partner.userId)}
                      >
                        {isDeleting ? 'Usuwanie...' : 'Usun partnera'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            <PaginationControls
              page={partnerData.page}
              onPageChange={(nextPage) => updatePartnerQuery({ page: nextPage })}
            />
          </>
        )}
      </section>
    )
  }

  function renderVenueView() {
    return (
      <section className="admin-dashboard__workspace">
        <div className="admin-dashboard__workspace-header">
          <div>
            <span className="admin-dashboard__workspace-eyebrow">Obiekty</span>
            <h2>Review obiektow</h2>
            <p>Przegladaj zgloszenia, komentuj poprawki i podejmuj decyzje.</p>
          </div>
        </div>

        <div className="admin-dashboard__toolbar">
          <input
            type="search"
            className="admin-dashboard__input"
            value={venueQuery.search}
            onChange={(event) => updateVenueQuery({ search: event.target.value, page: 0 })}
            placeholder="Szukaj po nazwie, adresie lub emailu managera"
          />
          <select
            className="admin-dashboard__select"
            value={venueQuery.status}
            onChange={(event) => updateVenueQuery({ status: event.target.value, page: 0 })}
          >
            {venueStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            className="admin-dashboard__select"
            value={venueQuery.sortBy}
            onChange={(event) => updateVenueQuery({ sortBy: event.target.value, page: 0 })}
          >
            <option value="createdAt">Sortuj: data</option>
            <option value="name">Sortuj: nazwa</option>
            <option value="status">Sortuj: status</option>
            <option value="basePricePerGuest">Sortuj: cena</option>
          </select>
          <select
            className="admin-dashboard__select"
            value={venueQuery.sortDir}
            onChange={(event) => updateVenueQuery({ sortDir: event.target.value, page: 0 })}
          >
            <option value="desc">Malejaco</option>
            <option value="asc">Rosnaco</option>
          </select>
          <select
            className="admin-dashboard__select"
            value={venueQuery.size}
            onChange={(event) => updateVenueQuery({ size: Number(event.target.value), page: 0 })}
          >
            <option value="8">8 / strona</option>
            <option value="16">16 / strona</option>
            <option value="24">24 / strona</option>
          </select>
        </div>

        {isLoadingVenues ? (
          <p className="admin-dashboard__empty">Ladowanie obiektow...</p>
        ) : venues.length === 0 ? (
          <p className="admin-dashboard__empty">Brak obiektow dla wybranych filtrow.</p>
        ) : (
          <>
            <div className="admin-dashboard__cards">
              {venues.map((venue) => {
                const isExpanded = Boolean(expandedVenues[venue.id])
                const comment = venueComments[venue.id] ?? ''
                const isDeletingVenue = Boolean(activeRequests[`venue-delete:${venue.id}`])
                const isCommentEditorActive = Boolean(commentEditors[venue.id])
                const isVenueDraft = venue.status === 'DRAFT'
                const lockActionsForComment = isCommentEditorActive && !isVenueDraft

                return (
                  <article key={venue.id} className="admin-dashboard__venue-card">
                    <div className="admin-dashboard__venue-top">
                      <div>
                        <h3>{venue.name}</h3>
                        <p>{venue.address?.city || '-'}, {venue.address?.street || '-'}</p>
                      </div>
                      <span className={`admin-dashboard__status-badge admin-dashboard__status-badge--${venue.status.toLowerCase()}`}>
                        {VENUE_STATUS_LABELS[venue.status] ?? venue.status}
                      </span>
                    </div>

                    <dl className="admin-dashboard__venue-meta">
                      <div>
                        <dt>Manager</dt>
                        <dd>{venue.managerEmail}</dd>
                      </div>
                      <div>
                        <dt>Zweryfikowany</dt>
                        <dd>{venue.verified ? 'Tak' : 'Nie'}</dd>
                      </div>
                      <div>
                        <dt>Dodano</dt>
                        <dd>{formatDateTime(venue.createdAt)}</dd>
                      </div>
                      <div>
                        <dt>Wojewodztwo</dt>
                        <dd>{venue.address?.voivodeship || '-'}</dd>
                      </div>
                    </dl>

                    <div className="admin-dashboard__comment-section">
                      {!isVenueDraft ? (
                        <button
                          type="button"
                          className={`admin-dashboard__secondary-action${isCommentEditorActive ? ' admin-dashboard__secondary-action--active' : ''}`}
                          onClick={() => toggleCommentEditor(venue.id)}
                        >
                          {isCommentEditorActive ? 'Ukryj komentarz do poprawy' : 'Dodaj komentarz do poprawy'}
                        </button>
                      ) : null}

                      {isCommentEditorActive || isVenueDraft ? (
                        <div className="admin-dashboard__feedback-panel">
                          <strong>Komentarz dla managera</strong>
                          <textarea
                            className="admin-dashboard__comment"
                            value={comment}
                            onChange={(event) => handleVenueCommentChange(venue.id, event.target.value)}
                            placeholder="Wpisz, co manager ma poprawic przed ponownym review."
                            rows="4"
                          />
                        </div>
                      ) : null}

                      <button
                        type="button"
                        className="admin-dashboard__details-toggle"
                        onClick={() => toggleVenueDetails(venue.id)}
                      >
                        {isExpanded ? 'Ukryj szczegoly zgloszenia' : 'Pokaz szczegoly zgloszenia'}
                      </button>
                    </div>

                    {isExpanded ? (
                      <section className="admin-dashboard__details" aria-label="Szczegoly zgloszenia">
                        <dl className="admin-dashboard__details-grid">
                          <div>
                            <dt>Styl</dt>
                            <dd>{venue.style || '-'}</dd>
                          </div>
                          <div>
                            <dt>Pojemnosc</dt>
                            <dd>{venue.capacityMin ?? '-'} - {venue.capacityMax ?? '-'}</dd>
                          </div>
                          <div>
                            <dt>Noclegi</dt>
                            <dd>{venue.hasAccommodation ? `Tak (${venue.accommodationPlaces ?? 0} miejsc)` : 'Nie'}</dd>
                          </div>
                          <div>
                            <dt>Cena od osoby</dt>
                            <dd>{formatPrice(venue.basePricePerGuest)}</dd>
                          </div>
                          <div>
                            <dt>Opata korkowa</dt>
                            <dd>{venue.noCorkageFee ? 'Brak' : 'Obowiazuje'}</dd>
                          </div>
                          <div>
                            <dt>Slub cywilny w ogrodzie</dt>
                            <dd>{venue.civilWeddingGarden ? 'Tak' : 'Nie'}</dd>
                          </div>
                          <div>
                            <dt>Kod pocztowy</dt>
                            <dd>{venue.address?.postalCode || '-'}</dd>
                          </div>
                          <div>
                            <dt>Wspolrzedne</dt>
                            <dd>{venue.address?.latitude ?? '-'}, {venue.address?.longitude ?? '-'}</dd>
                          </div>
                        </dl>
                        <div className="admin-dashboard__description">
                          <h4>Opis obiektu</h4>
                          <p>{venue.description || 'Brak opisu.'}</p>
                        </div>
                      </section>
                    ) : null}

                    <div className="admin-dashboard__actions">
                      <button
                        type="button"
                        className={`admin-dashboard__action admin-dashboard__action--approve ${venue.status === 'APPROVED' ? 'admin-dashboard__action--current' : ''}`}
                        disabled={isDeletingVenue || Boolean(activeRequests[`venue:${venue.id}:APPROVED`]) || venue.status === 'APPROVED' || venue.status === 'DRAFT' || lockActionsForComment}
                        onClick={() => handleVenueStatusUpdate(venue.id, 'APPROVED')}
                      >
                        Zaakceptuj
                      </button>
                      <button
                        type="button"
                        className={`admin-dashboard__action admin-dashboard__action--draft ${venue.status === 'DRAFT' ? 'admin-dashboard__action--current' : ''}`}
                        disabled={isDeletingVenue || Boolean(activeRequests[`venue:${venue.id}:DRAFT`]) || !comment.trim() || venue.status === 'DRAFT'}
                        onClick={() => handleVenueStatusUpdate(venue.id, 'DRAFT')}
                      >
                        Cofnij do poprawy
                      </button>
                      <button
                        type="button"
                        className={`admin-dashboard__action admin-dashboard__action--reject ${venue.status === 'REJECTED' ? 'admin-dashboard__action--current' : ''}`}
                        disabled={isDeletingVenue || Boolean(activeRequests[`venue:${venue.id}:REJECTED`]) || venue.status === 'REJECTED' || venue.status === 'DRAFT' || lockActionsForComment}
                        onClick={() => handleVenueStatusUpdate(venue.id, 'REJECTED')}
                      >
                        Odrzuc
                      </button>
                      <button
                        type="button"
                        className="admin-dashboard__action admin-dashboard__action--reject"
                        disabled={isDeletingVenue || lockActionsForComment}
                        onClick={() => handleVenueDelete(venue.id)}
                      >
                        {isDeletingVenue ? 'Usuwanie...' : 'Usun obiekt'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            <PaginationControls
              page={venueData.page}
              onPageChange={(nextPage) => updateVenueQuery({ page: nextPage })}
            />
          </>
        )}
      </section>
    )
  }

  function renderStatsView() {
    return (
      <section className="admin-dashboard__workspace">
        <div className="admin-dashboard__workspace-header">
          <div>
            <span className="admin-dashboard__workspace-eyebrow">Statystyki</span>
            <h2>Podsumowanie panelu admina</h2>
            <p>Ten widok pokazuje globalne liczby dla calego systemu, niezaleznie od aktywnych filtrow list.</p>
          </div>
        </div>

        <div className="admin-dashboard__stats-grid">
          <article className="admin-dashboard__stat-card">
            <span>Partnerzy zweryfikowani</span>
            <strong>{adminStats.partners.verified}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>Partnerzy oczekujacy</span>
            <strong>{adminStats.partners.pending}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>Obiekty oczekujace</span>
            <strong>{adminStats.venues.pending}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>Obiekty zaakceptowane</span>
            <strong>{adminStats.venues.approved}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>Konta User</span>
            <strong>{adminStats.users.users}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>Konta Manager</span>
            <strong>{adminStats.partners.total}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>Konta Admin</span>
            <strong>{adminStats.users.admins}</strong>
          </article>
        </div>
      </section>
    )
  }

  function renderUsersView() {
    return (
      <section className="admin-dashboard__workspace">
        <div className="admin-dashboard__workspace-header">
          <div>
            <span className="admin-dashboard__workspace-eyebrow">Uzytkownicy</span>
            <h2>Zarzadzanie uzytkownikami</h2>
            <p>Ta zakladka obsluguje tylko role User i Admin. Manager pozostaje poza tym ekranem.</p>
          </div>
        </div>

        <div className="admin-dashboard__stats-grid">
          <article className="admin-dashboard__stat-card">
            <span>Wszystkie konta</span>
            <strong>{userData.summary.total}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>User</span>
            <strong>{userData.summary.users}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>Admin</span>
            <strong>{userData.summary.admins}</strong>
          </article>
        </div>

        <div className="admin-dashboard__toolbar">
          <input
            type="search"
            className="admin-dashboard__input"
            value={userQuery.search}
            onChange={(event) => updateUserQuery({ search: event.target.value, page: 0 })}
            placeholder="Szukaj po emailu, imieniu, nazwisku lub telefonie"
          />
          <select
            className="admin-dashboard__select"
            value={userQuery.role}
            onChange={(event) => updateUserQuery({ role: event.target.value, page: 0 })}
          >
            <option value="all">Wszystkie role</option>
            <option value="CLIENT">User</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            className="admin-dashboard__select"
            value={userQuery.sortBy}
            onChange={(event) => updateUserQuery({ sortBy: event.target.value, page: 0 })}
          >
            <option value="createdAt">Sortuj: data</option>
            <option value="email">Sortuj: email</option>
            <option value="firstName">Sortuj: imie</option>
            <option value="lastName">Sortuj: nazwisko</option>
          </select>
          <select
            className="admin-dashboard__select"
            value={userQuery.sortDir}
            onChange={(event) => updateUserQuery({ sortDir: event.target.value, page: 0 })}
          >
            <option value="desc">Malejaco</option>
            <option value="asc">Rosnaco</option>
          </select>
          <select
            className="admin-dashboard__select"
            value={userQuery.size}
            onChange={(event) => updateUserQuery({ size: Number(event.target.value), page: 0 })}
          >
            <option value="10">10 / strona</option>
            <option value="20">20 / strona</option>
            <option value="50">50 / strona</option>
          </select>
        </div>

        {isLoadingUsers ? (
          <p className="admin-dashboard__empty">Ladowanie uzytkownikow...</p>
        ) : users.length === 0 ? (
          <p className="admin-dashboard__empty">Brak uzytkownikow dla wybranych filtrow.</p>
        ) : (
          <>
            <div className="admin-dashboard__user-list">
              {users.map((account) => {
                const isRoleUpdating = Boolean(activeRequests[`user-role:${account.id}`])
                const isDeleting = Boolean(activeRequests[`user-delete:${account.id}`])
                const nextRole = account.role === 'ADMIN' ? 'CLIENT' : 'ADMIN'
                const isExpanded = Boolean(expandedUsers[account.id])

                return (
                  <article key={account.id} className="admin-dashboard__user-card">
                    <div className="admin-dashboard__user-top">
                      <div>
                        <h3>{account.firstName || account.lastName ? `${account.firstName || ''} ${account.lastName || ''}`.trim() : account.email}</h3>
                        <p>{account.email}</p>
                      </div>

                      <div className="admin-dashboard__user-side">
                        <span className={`admin-dashboard__status-badge ${account.role === 'ADMIN' ? 'admin-dashboard__status-badge--approved' : 'admin-dashboard__status-badge--pending'}`}>
                          {USER_ROLE_LABELS[account.role] ?? account.role}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="admin-dashboard__details-toggle"
                      onClick={() => toggleUserDetails(account.id)}
                    >
                      {isExpanded ? 'Ukryj szczegoly konta' : 'Pokaz szczegoly konta'}
                    </button>

                    {isExpanded ? (
                      <section className="admin-dashboard__details" aria-label="Szczegoly konta">
                        <dl className="admin-dashboard__details-grid">
                          <div>
                            <dt>Rola</dt>
                            <dd>{USER_ROLE_LABELS[account.role] ?? account.role}</dd>
                          </div>
                          <div>
                            <dt>Telefon</dt>
                            <dd>{account.phoneNumber || '-'}</dd>
                          </div>
                          <div>
                            <dt>Status konta</dt>
                            <dd>{account.active ? 'Aktywne' : 'Nieaktywne'}</dd>
                          </div>
                          <div>
                            <dt>Utworzono</dt>
                            <dd>{formatDateTime(account.createdAt)}</dd>
                          </div>
                        </dl>
                      </section>
                    ) : null}

                    <div className="admin-dashboard__actions">
                      <button
                        type="button"
                        className="admin-dashboard__action admin-dashboard__action--approve"
                        disabled={isRoleUpdating || isDeleting}
                        onClick={() => handleUserRoleUpdate(account.id, nextRole)}
                      >
                        {isRoleUpdating
                          ? 'Zapisywanie...'
                          : account.role === 'ADMIN'
                            ? 'Zmien na User'
                            : 'Nadaj Admina'}
                      </button>
                      <button
                        type="button"
                        className="admin-dashboard__action admin-dashboard__action--reject"
                        disabled={isRoleUpdating || isDeleting}
                        onClick={() => handleUserDelete(account.id)}
                      >
                        {isDeleting ? 'Usuwanie...' : 'Usun konto'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            <PaginationControls
              page={userData.page}
              onPageChange={(nextPage) => updateUserQuery({ page: nextPage })}
            />
          </>
        )}
      </section>
    )
  }

  function renderIngredientsView() {
    const isSubmittingIngredient = Boolean(activeRequests[editingIngredientId == null ? 'ingredient-create' : `ingredient-update:${editingIngredientId}`])

    return (
      <section className="admin-dashboard__workspace">
        <div className="admin-dashboard__workspace-header">
          <div>
            <span className="admin-dashboard__workspace-eyebrow">Skladniki</span>
            <h2>Globalna lista skladnikow</h2>
            <p>Admin zarzadza wspolnym katalogiem skladnikow uzywanym pozniej w recepturach wszystkich obiektow.</p>
          </div>
        </div>

        <div className="admin-dashboard__stats-grid">
          <article className="admin-dashboard__stat-card">
            <span>Wszystkie skladniki</span>
            <strong>{ingredients.length}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>Mieso</span>
            <strong>{ingredients.filter((item) => item.category === 'MIESO').length}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>Nabial</span>
            <strong>{ingredients.filter((item) => item.category === 'NABIAL').length}</strong>
          </article>
          <article className="admin-dashboard__stat-card">
            <span>Warzywa i owoce</span>
            <strong>{ingredients.filter((item) => item.category === 'WARZYWA_OWOCE').length}</strong>
          </article>
        </div>

        <div className="admin-dashboard__toolbar">
          <input
            type="search"
            className="admin-dashboard__input"
            value={ingredientSearch}
            onChange={(event) => setIngredientSearch(event.target.value)}
            placeholder="Szukaj skladnika po nazwie"
          />
          <select
            className="admin-dashboard__select"
            value={ingredientCategoryFilter}
            onChange={(event) => setIngredientCategoryFilter(event.target.value)}
          >
            <option value="all">Wszystkie kategorie</option>
            <option value="MIESO">Mieso</option>
            <option value="NABIAL">Nabial</option>
            <option value="WARZYWA_OWOCE">Warzywa i owoce</option>
            <option value="SUCHE">Suche</option>
          </select>
          <button type="button" className="admin-dashboard__secondary-action" onClick={resetIngredientForm}>
            {editingIngredientId == null ? 'Wyczysc formularz' : 'Anuluj edycje'}
          </button>
        </div>

        <div className="admin-dashboard__ingredient-layout">
          <form className="admin-dashboard__ingredient-form" onSubmit={handleIngredientSubmit}>
            <h3>{editingIngredientId == null ? 'Nowy skladnik' : 'Edytuj skladnik'}</h3>

            <label className="admin-dashboard__field">
              <span>Nazwa</span>
              <input
                type="text"
                className="admin-dashboard__input"
                value={ingredientForm.name}
                onChange={(event) => setIngredientForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="np. Smietana 30%"
                required
              />
            </label>

            <label className="admin-dashboard__field">
              <span>Kategoria</span>
              <select
                className="admin-dashboard__select"
                value={ingredientForm.category}
                onChange={(event) => setIngredientForm((current) => ({ ...current, category: event.target.value }))}
              >
                <option value="MIESO">Mieso</option>
                <option value="NABIAL">Nabial</option>
                <option value="WARZYWA_OWOCE">Warzywa i owoce</option>
                <option value="SUCHE">Suche</option>
              </select>
            </label>

            <div className="admin-dashboard__ingredient-form-grid">
              <label className="admin-dashboard__field">
                <span>Jednostka</span>
                <select
                  className="admin-dashboard__select"
                  value={ingredientForm.defaultUnit}
                  onChange={(event) => setIngredientForm((current) => ({ ...current, defaultUnit: event.target.value }))}
                >
                  <option value="G">g</option>
                  <option value="ML">ml</option>
                  <option value="SZT">szt.</option>
                </select>
              </label>

              <label className="admin-dashboard__field">
                <span>Strata</span>
                <input
                  type="number"
                  min="0"
                  max="0.99"
                  step="0.01"
                  className="admin-dashboard__input"
                  value={ingredientForm.wastePercentage}
                  onChange={(event) => setIngredientForm((current) => ({ ...current, wastePercentage: event.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="admin-dashboard__actions">
              <button type="submit" className="admin-dashboard__submit" disabled={isSubmittingIngredient}>
                {isSubmittingIngredient ? 'Zapisywanie...' : editingIngredientId == null ? 'Dodaj skladnik' : 'Zapisz zmiany'}
              </button>
            </div>
          </form>

          <div className="admin-dashboard__ingredient-list">
            {isLoadingIngredients ? (
              <p className="admin-dashboard__empty">Ladowanie skladnikow...</p>
            ) : filteredIngredients.length === 0 ? (
              <p className="admin-dashboard__empty">Brak skladnikow dla wybranych filtrow.</p>
            ) : (
              filteredIngredients.map((ingredient) => {
                const isDeleting = Boolean(activeRequests[`ingredient-delete:${ingredient.id}`])
                const isEditingCurrent = editingIngredientId === ingredient.id

                return (
                  <article key={ingredient.id} className="admin-dashboard__ingredient-card">
                    <div className="admin-dashboard__ingredient-top">
                      <div>
                        <h3>{ingredient.name}</h3>
                        <p>{INGREDIENT_CATEGORY_LABELS[ingredient.category] ?? ingredient.category}</p>
                      </div>
                      <span className="admin-dashboard__status-badge">
                        {UNIT_LABELS[ingredient.defaultUnit] ?? ingredient.defaultUnit}
                      </span>
                    </div>

                    <dl className="admin-dashboard__details-grid admin-dashboard__details-grid--compact">
                      <div>
                        <dt>Jednostka</dt>
                        <dd>{UNIT_LABELS[ingredient.defaultUnit] ?? ingredient.defaultUnit}</dd>
                      </div>
                      <div>
                        <dt>Strata</dt>
                        <dd>{formatWastePercentage(ingredient.wastePercentage)}</dd>
                      </div>
                    </dl>

                    <div className="admin-dashboard__actions">
                      <button
                        type="button"
                        className="admin-dashboard__secondary-action"
                        onClick={() => startIngredientEdit(ingredient)}
                        disabled={isDeleting}
                      >
                        {isEditingCurrent ? 'Edytujesz' : 'Edytuj'}
                      </button>
                      <button
                        type="button"
                        className="admin-dashboard__action admin-dashboard__action--reject"
                        onClick={() => handleIngredientDelete(ingredient.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Usuwanie...' : 'Usun'}
                      </button>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </div>
      </section>
    )
  }

  function renderWorkspace() {
    if (adminView === 'stats') {
      return renderStatsView()
    }

    if (adminView === 'partners') {
      return renderPartnerView()
    }

    if (adminView === 'users') {
      return renderUsersView()
    }

    if (adminView === 'ingredients') {
      return renderIngredientsView()
    }

    return renderVenueView()
  }

  return (
    <main className="admin-dashboard">
      <section className="admin-dashboard__panel">
        <header className="admin-dashboard__header">
          <div>
            <span className="admin-dashboard__eyebrow">Dashboard admina</span>
            <h1 className="admin-dashboard__title">Zarzadzanie partnerami i obiektami</h1>
            <p className="admin-dashboard__text">Uproszczony panel review z boczna nawigacja i podzialem na ekrany.</p>
          </div>
          <button type="button" className="admin-dashboard__submit" onClick={handleRefresh}>
            Odswiez dane
          </button>
        </header>

        {error ? <p className="admin-dashboard__error">{error}</p> : null}

        <div className="admin-dashboard__layout">
          <aside className="admin-dashboard__sidebar">
            <section className="admin-dashboard__sidebar-section">
              <span className="admin-dashboard__sidebar-label">Panel</span>
              <strong className="admin-dashboard__sidebar-title">
                {adminView === 'stats'
                  ? 'Statystyki'
                  : adminView === 'partners'
                    ? 'Partnerzy'
                    : adminView === 'users'
                      ? 'Uzytkownicy'
                      : adminView === 'ingredients'
                        ? 'Skladniki'
                        : 'Obiekty'}
              </strong>
              <span className="admin-dashboard__sidebar-meta">
                {adminView === 'stats'
                  ? 'Globalny widok liczb dla calego systemu.'
                  : adminView === 'partners'
                  ? 'Weryfikacja partnerow i filtrowanie profili.'
                  : adminView === 'users'
                    ? 'Lista kont User i Admin z mozliwoscia zmiany roli albo usuniecia.'
                    : adminView === 'ingredients'
                      ? 'Globalny katalog skladnikow wykorzystywany w menu obiektow.'
                    : 'Review sal, komentarze i decyzje administracyjne.'}
              </span>
            </section>

            <section className="admin-dashboard__sidebar-section">
              <span className="admin-dashboard__sidebar-label">Ekrany</span>
              <div className="admin-dashboard__nav-group">
                <button
                  type="button"
                  className={`admin-dashboard__nav-button${adminView === 'stats' ? ' admin-dashboard__nav-button--active' : ''}`}
                  onClick={() => setAdminView('stats')}
                >
                  Statystyki
                </button>
                <button
                  type="button"
                  className={`admin-dashboard__nav-button${adminView === 'partners' ? ' admin-dashboard__nav-button--active' : ''}`}
                  onClick={() => setAdminView('partners')}
                >
                  Partnerzy
                </button>
                <button
                  type="button"
                  className={`admin-dashboard__nav-button${adminView === 'venues' ? ' admin-dashboard__nav-button--active' : ''}`}
                  onClick={() => setAdminView('venues')}
                >
                  Obiekty
                </button>
                <button
                  type="button"
                  className={`admin-dashboard__nav-button${adminView === 'users' ? ' admin-dashboard__nav-button--active' : ''}`}
                  onClick={() => setAdminView('users')}
                >
                  Uzytkownicy
                </button>
                <button
                  type="button"
                  className={`admin-dashboard__nav-button${adminView === 'ingredients' ? ' admin-dashboard__nav-button--active' : ''}`}
                  onClick={() => setAdminView('ingredients')}
                >
                  Skladniki
                </button>
              </div>
            </section>

          </aside>

          {renderWorkspace()}
        </div>
      </section>
    </main>
  )
}

export default AdminPage
