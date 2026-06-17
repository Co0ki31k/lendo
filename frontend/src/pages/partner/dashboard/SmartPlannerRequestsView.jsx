import { useEffect, useMemo, useState } from 'react'
import { partnerApi } from '../../../api'
import { SMART_PLANNER_STATUS_OPTIONS, formatSmartPlannerStatus } from '../../../features/smartplanner/statusLabels.js'

function formatCurrency(value) {
  if (value == null) {
    return '-'
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatDate(value, withTime = false) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pl-PL', withTime ? {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  } : {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function SmartPlannerRequestsView() {
  const [filters, setFilters] = useState({
    status: '',
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
  const [decisionOverride, setDecisionOverride] = useState('')
  const [comment, setComment] = useState('')
  const [submitState, setSubmitState] = useState({
    status: 'idle',
    error: '',
  })
  const canDecide = detailState.booking?.status === 'SUBMITTED' || detailState.booking?.status === 'CHANGE_REQUESTED'
  const isChangeRequest = detailState.booking?.status === 'CHANGE_REQUESTED'

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

        setListState({
          status: 'ready',
          error: '',
          data: response,
        })

        setSelectedBookingId((current) => (
          current && response.items.some((booking) => booking.bookingId === current)
            ? current
            : (response.items[0]?.bookingId ?? null)
        ))
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        setListState({
          status: 'error',
          error: requestError.response?.data?.message ?? 'Nie udalo sie pobrac zgłoszen smartplannera.',
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

        setDetailState({
          status: 'ready',
          error: '',
          booking: response,
        })
        setComment(response.decisionComment ?? '')
        setSubmitState({ status: 'idle', error: '' })
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        setDetailState({
          status: 'error',
          error: requestError.response?.data?.message ?? 'Nie udalo sie pobrac szczegolow zgłoszenia.',
          booking: null,
        })
      }
    }

    void loadDetails()

    return () => {
      isMounted = false
    }
  }, [selectedBookingId])

  const bookings = useMemo(
    () => (listState.data?.items ?? []).filter((booking) => booking.status !== 'CANCELLATION_REQUESTED'),
    [listState.data],
  )
  const summary = listState.data?.summary

  const decision = decisionOverride || (detailState.booking?.status === 'CHANGE_REQUESTED' ? 'APPROVE_CHANGES' : 'APPROVED')

  async function handleDecisionSubmit(event) {
    event.preventDefault()

    if (!detailState.booking) {
      return
    }

    setSubmitState({ status: 'loading', error: '' })

    try {
      const response = await partnerApi.decideSmartPlannerBooking(detailState.booking.bookingId, {
        decision,
        comment: comment || null,
      })

        setDetailState({
          status: 'ready',
          error: '',
          booking: response,
        })
      setDecisionOverride('')
      setComment(response.decisionComment ?? '')
      setSubmitState({ status: 'success', error: '' })
      setListState((current) => {
        if (!current.data) {
          return current
        }

        const nextItems = current.data.items.map((booking) => (
          booking.bookingId === response.bookingId
            ? response
            : booking
        ))

        const nextSummary = {
          ...current.data.summary,
          submitted: nextItems.filter((booking) => booking.status === 'SUBMITTED').length,
          approved: nextItems.filter((booking) => booking.status === 'APPROVED').length,
          rejected: nextItems.filter((booking) => booking.status === 'REJECTED').length,
          expired: nextItems.filter((booking) => booking.status === 'EXPIRED').length,
          cancelled: nextItems.filter((booking) => booking.status === 'CANCELLED').length,
          total: nextItems.length,
        }

        return {
          ...current,
          data: {
            ...current.data,
            items: nextItems.filter((booking) => booking.status !== 'CANCELLATION_REQUESTED'),
            summary: nextSummary,
          },
        }
      })
    } catch (requestError) {
      setSubmitState({
        status: 'error',
        error: requestError.response?.data?.message ?? 'Nie udalo sie zapisac decyzji.',
      })
    }
  }

  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">SmartPlanner</span>
          <h2>Zarzadzanie zgloszeniami</h2>
          <p>Filtruj zgloszenia klientow, wybieraj booking i zatwierdzaj albo odrzucaj go bez wychodzenia z dashboardu.</p>
        </div>
      </div>

      <div className="partner-dashboard__stats-grid">
        <article className="partner-dashboard__stat-card">
          <span>Wszystkie</span>
          <strong>{summary?.total ?? 0}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Oczekujace</span>
          <strong>{summary?.submitted ?? 0}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Zatwierdzone</span>
          <strong>{summary?.approved ?? 0}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Odrzucone</span>
          <strong>{summary?.rejected ?? 0}</strong>
        </article>
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

      {listState.status === 'loading' ? (
        <div className="partner-dashboard__placeholder-panel">
          <strong>Ladowanie zgloszen</strong>
          <span>Trwa pobieranie bookingow smartplannera.</span>
        </div>
      ) : null}
      {listState.status === 'error' ? <p className="partner-dashboard__error">{listState.error}</p> : null}

      {listState.status === 'ready' ? (
        bookings.length > 0 ? (
          <div className="partner-dashboard__smartplanner-layout">
            <div className="partner-dashboard__smartplanner-list">
              {bookings.map((booking) => (
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
                    <strong>{formatCurrency(booking.totalEstimatedCost)}</strong>
                  </div>

                  <dl className="partner-dashboard__venue-meta">
                    <div>
                      <dt>Goscie</dt>
                      <dd>{booking.estimatedGuests}</dd>
                    </div>
                    <div>
                      <dt>Service</dt>
                      <dd>{booking.fullService ? 'Full service' : 'Bez full service'}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{booking.clientEmail}</dd>
                    </div>
                    <div>
                      <dt>Cena / osoba</dt>
                      <dd>{formatCurrency(booking.pricePerGuest)}</dd>
                    </div>
                  </dl>
                </button>
              ))}
            </div>

            <div className="partner-dashboard__smartplanner-detail">
              {detailState.status === 'loading' ? (
                <div className="partner-dashboard__placeholder-panel">
                  <strong>Ladowanie szczegolow</strong>
                  <span>Trwa pobieranie szczegolow wybranego zgloszenia.</span>
                </div>
              ) : null}
              {detailState.status === 'error' ? <p className="partner-dashboard__error">{detailState.error}</p> : null}

              {detailState.status === 'ready' && detailState.booking ? (
                <>
                  <article className="partner-dashboard__smartplanner-card">
                    <div className="partner-dashboard__workspace-header">
                      <div>
                        <span className="partner-dashboard__workspace-eyebrow">Szczegoly zgloszenia</span>
                        <h2>{detailState.booking.venueName}</h2>
                        <p>
                          Termin {formatDate(detailState.booking.eventDate)}.
                          Klient: {detailState.booking.clientFirstName || '-'} {detailState.booking.clientLastName || ''} ({detailState.booking.clientEmail})
                        </p>
                      </div>
                      <span className={`partner-dashboard__status-badge partner-dashboard__status-badge--${detailState.booking.status.toLowerCase()}`}>
                        {formatSmartPlannerStatus(detailState.booking.status)}
                      </span>
                    </div>
                  </article>

                  <article className="partner-dashboard__smartplanner-card">
                    <dl className="partner-dashboard__venue-meta partner-dashboard__venue-meta--expanded partner-dashboard__venue-meta--flush">
                      <div>
                        <dt>Liczba gosci</dt>
                        <dd>{detailState.booking.estimatedGuests}</dd>
                      </div>
                      <div>
                        <dt>Cena za osobe</dt>
                        <dd>{formatCurrency(detailState.booking.pricePerGuest)}</dd>
                      </div>
                      <div>
                        <dt>Budzet max klienta</dt>
                        <dd>{formatCurrency(detailState.booking.maxPricePerGuest)}</dd>
                      </div>
                      <div>
                        <dt>Koszt estymowany</dt>
                        <dd>{formatCurrency(detailState.booking.totalEstimatedCost)}</dd>
                      </div>
                      <div>
                        <dt>Service</dt>
                        <dd>{detailState.booking.fullService ? 'Full service' : 'Bez full service'}</dd>
                      </div>
                      <div>
                        <dt>Data wyslania</dt>
                        <dd>{formatDate(detailState.booking.createdAt, true)}</dd>
                      </div>
                      <div>
                        <dt>Standard</dt>
                        <dd>{detailState.booking.dietLogistics.menuStandardCount}</dd>
                      </div>
                      <div>
                        <dt>Vegetarian</dt>
                        <dd>{detailState.booking.dietLogistics.menuVegetarianCount}</dd>
                      </div>
                      <div>
                        <dt>Vegan</dt>
                        <dd>{detailState.booking.dietLogistics.menuVeganCount}</dd>
                      </div>
                      <div>
                        <dt>Gluten free</dt>
                        <dd>{detailState.booking.dietLogistics.menuGlutenFreeCount}</dd>
                      </div>
                    </dl>
                  </article>

                  <article className="partner-dashboard__smartplanner-card">
                    <div className="partner-dashboard__feedback-panel partner-dashboard__feedback-panel--compact">
                      <strong>Alergie</strong>
                      <p>{detailState.booking.dietLogistics.allergiesNotes || 'Brak uwag o alergiach.'}</p>
                    </div>
                  </article>

                  <article className="partner-dashboard__smartplanner-card">
                    <div className="partner-dashboard__feedback-panel partner-dashboard__feedback-panel--compact">
                      <strong>Uwagi klienta</strong>
                      <p>{detailState.booking.serviceNotes || 'Brak dodatkowych uwag.'}</p>
                    </div>
                  </article>

                  {detailState.booking.clientRequestNotes ? (
                    <article className="partner-dashboard__smartplanner-card">
                      <div className="partner-dashboard__feedback-panel partner-dashboard__feedback-panel--compact">
                        <strong>Powod klienta</strong>
                        <p>{detailState.booking.clientRequestNotes}</p>
                      </div>
                    </article>
                  ) : null}

                  {detailState.booking.pendingChange ? (
                    <article className="partner-dashboard__smartplanner-card">
                      <strong className="partner-dashboard__shopping-title">Proponowane zmiany</strong>
                      <dl className="partner-dashboard__venue-meta partner-dashboard__venue-meta--flush">
                        <div><dt>Gosci</dt><dd>{detailState.booking.pendingChange.estimatedGuests}</dd></div>
                        <div><dt>Budzet max</dt><dd>{formatCurrency(detailState.booking.pendingChange.maxPricePerGuest)}</dd></div>
                        <div><dt>Service</dt><dd>{detailState.booking.pendingChange.fullService ? 'Full service' : 'Bez full service'}</dd></div>
                        <div><dt>Standard</dt><dd>{detailState.booking.pendingChange.dietLogistics.menuStandardCount}</dd></div>
                        <div><dt>Vegetarian</dt><dd>{detailState.booking.pendingChange.dietLogistics.menuVegetarianCount}</dd></div>
                        <div><dt>Vegan</dt><dd>{detailState.booking.pendingChange.dietLogistics.menuVeganCount}</dd></div>
                        <div><dt>Gluten free</dt><dd>{detailState.booking.pendingChange.dietLogistics.menuGlutenFreeCount}</dd></div>
                      </dl>
                      <p className="partner-dashboard__venue-note">{detailState.booking.pendingChange.requestNotes || 'Brak uzasadnienia zmiany.'}</p>
                    </article>
                  ) : null}

                  <article className="partner-dashboard__smartplanner-card">
                    <form className="partner-dashboard__form partner-dashboard__form--compact" onSubmit={(event) => void handleDecisionSubmit(event)}>
                      <label className="partner-dashboard__field">
                        <span>Decyzja</span>
                        <select
                          className="partner-dashboard__select"
                          value={decision}
                          onChange={(event) => setDecisionOverride(event.target.value)}
                          disabled={!canDecide}
                        >
                          {isChangeRequest ? (
                            <>
                              <option value="APPROVE_CHANGES">Zatwierdz zmiany</option>
                              <option value="REJECT_CHANGES">Odrzuc zmiany</option>
                            </>
                          ) : (
                            <>
                              <option value="APPROVED">Zatwierdz booking</option>
                              <option value="REJECTED">Odrzuc booking</option>
                            </>
                          )}
                        </select>
                      </label>

                      <label className="partner-dashboard__field partner-dashboard__field--full">
                        <span>Komentarz managera</span>
                        <textarea
                          rows="5"
                          value={comment}
                          onChange={(event) => setComment(event.target.value)}
                          disabled={!canDecide}
                        />
                      </label>

                      {submitState.error ? <p className="partner-dashboard__error">{submitState.error}</p> : null}
                      {submitState.status === 'success' ? (
                        <p className="partner-dashboard__notice">Decyzja zostala zapisana.</p>
                      ) : null}

                      <div className="partner-dashboard__edit-actions">
                        <button
                          type="submit"
                          className="partner-dashboard__submit"
                          disabled={!canDecide || submitState.status === 'loading'}
                        >
                          {submitState.status === 'loading'
                            ? 'Zapisywanie...'
                            : canDecide
                              ? 'Zapisz decyzje'
                              : 'Zgloszenie juz rozpatrzone'}
                        </button>
                      </div>
                    </form>
                  </article>

                  <article className="partner-dashboard__smartplanner-card">
                    <div className="partner-dashboard__feedback-panel partner-dashboard__feedback-panel--compact">
                      <strong>Historia decyzji</strong>
                      <p>
                        Rozpatrzono: {detailState.booking.decidedAt ? formatDate(detailState.booking.decidedAt, true) : 'Jeszcze nie rozpatrzono'}.
                        {' '}Ostatni komentarz: {detailState.booking.decisionComment || 'Brak'}.
                      </p>
                    </div>
                  </article>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="partner-dashboard__placeholder-panel">
            <strong>Brak zgloszen</strong>
            <span>Nie ma bookingow smartplannera dla wybranych filtrow.</span>
          </div>
        )
      ) : null}
    </section>
  )
}

export default SmartPlannerRequestsView
