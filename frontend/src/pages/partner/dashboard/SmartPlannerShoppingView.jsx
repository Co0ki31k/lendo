import { useEffect, useMemo, useState } from 'react'
import { partnerApi } from '../../../api'
import { SMART_PLANNER_STATUS_OPTIONS, formatSmartPlannerStatus } from '../../../features/smartplanner/statusLabels.js'

const MENU_INGREDIENTS = {
  standard: [
    { name: 'Filet z kurczaka', unit: 'kg', amount: 0.18 },
    { name: 'Ziemniaki', unit: 'kg', amount: 0.25 },
    { name: 'Warzywa sezonowe', unit: 'kg', amount: 0.12 },
    { name: 'Sos smietanowy', unit: 'l', amount: 0.06 },
  ],
  vegetarian: [
    { name: 'Halloumi', unit: 'kg', amount: 0.16 },
    { name: 'Ryż arborio', unit: 'kg', amount: 0.09 },
    { name: 'Warzywa sezonowe', unit: 'kg', amount: 0.14 },
    { name: 'Ser feta', unit: 'kg', amount: 0.04 },
  ],
  vegan: [
    { name: 'Tofu', unit: 'kg', amount: 0.18 },
    { name: 'Ryż basmati', unit: 'kg', amount: 0.09 },
    { name: 'Warzywa sezonowe', unit: 'kg', amount: 0.16 },
    { name: 'Mleko kokosowe', unit: 'l', amount: 0.07 },
  ],
  glutenFree: [
    { name: 'Filet z indyka', unit: 'kg', amount: 0.18 },
    { name: 'Ryż basmati', unit: 'kg', amount: 0.1 },
    { name: 'Warzywa sezonowe', unit: 'kg', amount: 0.14 },
    { name: 'Sos ziolowy', unit: 'l', amount: 0.06 },
  ],
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatAmount(amount, unit) {
  const formatted = new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${formatted} ${unit}`
}

function buildShoppingSummary(booking) {
  if (!booking || !booking.fullService) {
    return []
  }

  const totals = new Map()
  const menuCounts = {
    standard: booking.dietLogistics.menuStandardCount,
    vegetarian: booking.dietLogistics.menuVegetarianCount,
    vegan: booking.dietLogistics.menuVeganCount,
    glutenFree: booking.dietLogistics.menuGlutenFreeCount,
  }

  Object.entries(menuCounts).forEach(([menuKey, count]) => {
    if (!count || count <= 0) {
      return
    }

    MENU_INGREDIENTS[menuKey].forEach((ingredient) => {
      const mapKey = `${ingredient.name}:${ingredient.unit}`
      const previous = totals.get(mapKey) ?? { ...ingredient, total: 0 }
      previous.total += ingredient.amount * count
      totals.set(mapKey, previous)
    })
  })

  return Array.from(totals.values()).sort((left, right) => left.name.localeCompare(right.name, 'pl'))
}

function SmartPlannerShoppingView() {
  const [filters, setFilters] = useState({
    status: 'APPROVED',
    eventDateFrom: '',
    eventDateTo: '',
  })
  const [listState, setListState] = useState({
    status: 'loading',
    error: '',
    data: null,
  })
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [detailState, setDetailState] = useState({
    status: 'idle',
    error: '',
    booking: null,
  })

  useEffect(() => {
    let isMounted = true

    async function loadBookings() {
      setListState({ status: 'loading', error: '', data: null })

      try {
        const response = await partnerApi.getSmartPlannerBookings({
          status: filters.status || undefined,
          eventDateFrom: filters.eventDateFrom || undefined,
          eventDateTo: filters.eventDateTo || undefined,
        })

        if (!isMounted) {
          return
        }

        setListState({ status: 'ready', error: '', data: response })
        setSelectedBookingId((current) => (
          current && response.items.some((booking) => booking.bookingId === current)
            ? current
            : (response.items[0]?.bookingId ?? null)
        ))
      } catch (error) {
        if (!isMounted) {
          return
        }

        setListState({
          status: 'error',
          error: error.response?.data?.message ?? 'Nie udalo sie pobrac listy wydarzen do zakupow.',
          data: null,
        })
      }
    }

    void loadBookings()

    return () => {
      isMounted = false
    }
  }, [filters])

  useEffect(() => {
    if (!selectedBookingId) {
      return
    }

    let isMounted = true

    async function loadDetails() {
      setDetailState({ status: 'loading', error: '', booking: null })

      try {
        const response = await partnerApi.getSmartPlannerBookingDetails(selectedBookingId)

        if (!isMounted) {
          return
        }

        setDetailState({ status: 'ready', error: '', booking: response })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setDetailState({
          status: 'error',
          error: error.response?.data?.message ?? 'Nie udalo sie pobrac szczegolow wydarzenia.',
          booking: null,
        })
      }
    }

    void loadDetails()

    return () => {
      isMounted = false
    }
  }, [selectedBookingId])

  const bookings = listState.data?.items ?? []
  const shoppingItems = useMemo(() => buildShoppingSummary(detailState.booking), [detailState.booking])
  const totalPortions = detailState.booking
    ? detailState.booking.dietLogistics.menuStandardCount
      + detailState.booking.dietLogistics.menuVegetarianCount
      + detailState.booking.dietLogistics.menuVeganCount
      + detailState.booking.dietLogistics.menuGlutenFreeCount
    : 0

  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Logistyka</span>
          <h2>Lista zakupow</h2>
          <p>Wybierz wydarzenie i sprawdz zsumowane skladniki potrzebne do realizacji menu.</p>
        </div>
      </div>

      <div className="partner-dashboard__toolbar">
        <select
          className="partner-dashboard__select"
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
        >
          {SMART_PLANNER_STATUS_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>{option.label}</option>
          ))}
        </select>
        <input
          className="partner-dashboard__input"
          type="date"
          value={filters.eventDateFrom}
          onChange={(event) => setFilters((current) => ({ ...current, eventDateFrom: event.target.value }))}
        />
        <input
          className="partner-dashboard__input"
          type="date"
          value={filters.eventDateTo}
          onChange={(event) => setFilters((current) => ({ ...current, eventDateTo: event.target.value }))}
        />
      </div>

      <div className="partner-dashboard__smartplanner-layout">
        <div className="partner-dashboard__smartplanner-list">
          {listState.status === 'loading' ? (
            <div className="partner-dashboard__placeholder-panel">
              <strong>Ladowanie wydarzen</strong>
              <span>Trwa pobieranie listy bookingow.</span>
            </div>
          ) : null}
          {listState.status === 'error' ? <p className="partner-dashboard__error">{listState.error}</p> : null}

          {listState.status === 'ready' && bookings.length > 0 ? bookings.map((booking) => (
            <button
              key={booking.bookingId}
              type="button"
              className={`partner-dashboard__venue-card-button${selectedBookingId === booking.bookingId ? ' partner-dashboard__venue-card-button--active' : ''}`}
              onClick={() => setSelectedBookingId(booking.bookingId)}
            >
              <div className="partner-dashboard__venue-top">
                <div>
                  <span className={`partner-dashboard__status-badge partner-dashboard__status-badge--${booking.status.toLowerCase()}`}>
                    {formatSmartPlannerStatus(booking.status)}
                  </span>
                  <h3>{booking.venueName}</h3>
                  <p>{formatDate(booking.eventDate)} | {booking.clientFirstName || '-'} {booking.clientLastName || ''}</p>
                </div>
                <strong>{booking.estimatedGuests}</strong>
              </div>
            </button>
          )) : null}

          {listState.status === 'ready' && bookings.length === 0 ? (
            <div className="partner-dashboard__placeholder-panel">
              <strong>Brak wydarzen</strong>
              <span>Nie ma bookingow dla wybranych filtrow.</span>
            </div>
          ) : null}
        </div>

        <div className="partner-dashboard__smartplanner-detail">
          {detailState.status === 'loading' ? (
            <div className="partner-dashboard__placeholder-panel">
              <strong>Ladowanie listy zakupow</strong>
              <span>Trwa pobieranie szczegolow wybranego wydarzenia.</span>
            </div>
          ) : null}
          {detailState.status === 'error' ? <p className="partner-dashboard__error">{detailState.error}</p> : null}

          {detailState.status === 'ready' && detailState.booking ? (
            <>
              <article className="partner-dashboard__smartplanner-card">
                <div className="partner-dashboard__workspace-header">
                  <div>
                    <span className="partner-dashboard__workspace-eyebrow">Wybrane wydarzenie</span>
                    <h2>{detailState.booking.venueName}</h2>
                    <p>{formatDate(detailState.booking.eventDate)} | {detailState.booking.clientFirstName || '-'} {detailState.booking.clientLastName || ''}</p>
                  </div>
                  <span className={`partner-dashboard__status-badge partner-dashboard__status-badge--${detailState.booking.status.toLowerCase()}`}>
                    {formatSmartPlannerStatus(detailState.booking.status)}
                  </span>
                </div>
              </article>

              <div className="partner-dashboard__stats-grid partner-dashboard__stats-grid--calendar">
                <article className="partner-dashboard__stat-card">
                  <span>Porcje lacznie</span>
                  <strong>{totalPortions}</strong>
                </article>
                <article className="partner-dashboard__stat-card">
                  <span>Pozycje zakupowe</span>
                  <strong>{shoppingItems.length}</strong>
                </article>
                <article className="partner-dashboard__stat-card">
                  <span>Service</span>
                  <strong>{detailState.booking.fullService ? 'Tak' : 'Nie'}</strong>
                </article>
                <article className="partner-dashboard__stat-card">
                  <span>Gosci</span>
                  <strong>{detailState.booking.estimatedGuests}</strong>
                </article>
              </div>

              <article className="partner-dashboard__smartplanner-card">
                <dl className="partner-dashboard__venue-meta partner-dashboard__venue-meta--flush">
                  <div><dt>Standard</dt><dd>{detailState.booking.dietLogistics.menuStandardCount}</dd></div>
                  <div><dt>Vegetarian</dt><dd>{detailState.booking.dietLogistics.menuVegetarianCount}</dd></div>
                  <div><dt>Vegan</dt><dd>{detailState.booking.dietLogistics.menuVeganCount}</dd></div>
                  <div><dt>Gluten free</dt><dd>{detailState.booking.dietLogistics.menuGlutenFreeCount}</dd></div>
                </dl>
              </article>

              {detailState.booking.fullService ? (
                <article className="partner-dashboard__smartplanner-card">
                  <div className="partner-dashboard__shopping-list">
                    {shoppingItems.map((item) => (
                      <div key={`${item.name}-${item.unit}`} className="partner-dashboard__shopping-item">
                        <span>{item.name}</span>
                        <strong>{formatAmount(item.total, item.unit)}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              ) : (
                <div className="partner-dashboard__placeholder-panel">
                  <strong>Brak listy zakupow</strong>
                  <span>To wydarzenie jest oznaczone jako bez full service, wiec skladniki nie sa naliczane.</span>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default SmartPlannerShoppingView
