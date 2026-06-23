import { useEffect, useMemo, useState } from 'react'
import { partnerApi } from '../../../api'
import { formatSmartPlannerStatus } from '../../../features/smartplanner/statusLabels.js'

function calculateSpecialPrice(basePrice, discountPercentage) {
  const numericBasePrice = Number(basePrice)
  const numericDiscount = Number(discountPercentage)

  if (!Number.isFinite(numericBasePrice) || numericBasePrice <= 0 || !Number.isFinite(numericDiscount)) {
    return ''
  }

  const computedPrice = numericBasePrice * (1 - (numericDiscount / 100))
  return Math.max(0, Number(computedPrice.toFixed(2)))
}

function calculateDiscountPercentage(basePrice, specialPrice) {
  const numericBasePrice = Number(basePrice)
  const numericSpecialPrice = Number(specialPrice)

  if (!Number.isFinite(numericBasePrice) || numericBasePrice <= 0 || !Number.isFinite(numericSpecialPrice)) {
    return ''
  }

  const computedDiscount = ((numericBasePrice - numericSpecialPrice) / numericBasePrice) * 100
  return Math.min(100, Math.max(0, Number(computedDiscount.toFixed(2))))
}

function toNullableNumber(value) {
  if (value === '' || value == null) {
    return null
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
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

function WeddChanceManagementView() {
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
  const [form, setForm] = useState({
    decision: 'APPROVE_CANCELLATION_WEDDCHANCE',
    comment: '',
    discountPercentage: 15,
    specialPricePerGuest: '',
    allowGuestCountAdjustment: 'false',
    minGuestCount: '',
    maxGuestCount: '',
    dealDescription: '',
  })
  const [submitState, setSubmitState] = useState({
    status: 'idle',
    error: '',
  })

  useEffect(() => {
    let isMounted = true

    async function loadBookings() {
      setListState({ status: 'loading', error: '', data: null })

      try {
        const response = await partnerApi.getSmartPlannerBookings({
          status: 'CANCELLATION_REQUESTED',
        })

        if (!isMounted) {
          return
        }

        setListState({ status: 'ready', error: '', data: response })
        setSelectedBookingId(response.items[0]?.bookingId ?? null)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setListState({
          status: 'error',
          error: error.response?.data?.message ?? 'Nie udalo sie pobrac anulowanych wydarzen.',
          data: null,
        })
      }
    }

    void loadBookings()

    return () => {
      isMounted = false
    }
  }, [])

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
        const initialDiscount = calculateDiscountPercentage(response.pricePerGuest, response.pricePerGuest)
        setForm((current) => ({
          ...current,
          comment: response.decisionComment ?? '',
          discountPercentage: initialDiscount,
          specialPricePerGuest: response.pricePerGuest ? Number(response.pricePerGuest) : '',
          minGuestCount: response.estimatedGuests,
          maxGuestCount: response.estimatedGuests,
          dealDescription: response.serviceNotes ?? '',
        }))
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

  const items = useMemo(() => listState.data?.items ?? [], [listState.data])
  const canCreateWeddChance = form.decision === 'APPROVE_CANCELLATION_WEDDCHANCE'
  const basePricePerGuest = detailState.booking?.pricePerGuest ? Number(detailState.booking.pricePerGuest) : 0

  function handleDiscountChange(rawValue) {
    setForm((current) => ({
      ...current,
      discountPercentage: rawValue,
      specialPricePerGuest: rawValue === '' ? '' : calculateSpecialPrice(basePricePerGuest, rawValue),
    }))
  }

  function handleSpecialPriceChange(rawValue) {
    setForm((current) => ({
      ...current,
      specialPricePerGuest: rawValue,
      discountPercentage: rawValue === '' ? '' : calculateDiscountPercentage(basePricePerGuest, rawValue),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!detailState.booking) {
      return
    }

    setSubmitState({ status: 'loading', error: '' })

    try {
      await partnerApi.decideSmartPlannerBooking(detailState.booking.bookingId, {
        decision: form.decision,
        comment: form.comment || null,
        discountPercentage: canCreateWeddChance ? toNullableNumber(form.discountPercentage) : null,
        specialPricePerGuest: canCreateWeddChance ? toNullableNumber(form.specialPricePerGuest) : null,
        allowGuestCountAdjustment: canCreateWeddChance ? form.allowGuestCountAdjustment === 'true' : null,
        minGuestCount: canCreateWeddChance && form.allowGuestCountAdjustment === 'true' ? toNullableNumber(form.minGuestCount) : null,
        maxGuestCount: canCreateWeddChance && form.allowGuestCountAdjustment === 'true' ? toNullableNumber(form.maxGuestCount) : null,
        dealDescription: canCreateWeddChance ? form.dealDescription || null : null,
      })

      setSubmitState({ status: 'success', error: '' })
      setDetailState({ status: 'idle', error: '', booking: null })

      const response = await partnerApi.getSmartPlannerBookings({ status: 'CANCELLATION_REQUESTED' })
      setListState({ status: 'ready', error: '', data: response })
      setSelectedBookingId(response.items[0]?.bookingId ?? null)
    } catch (error) {
      setSubmitState({
        status: 'error',
        error: error.response?.data?.message ?? 'Nie udalo sie zapisac decyzji WeddChance.',
      })
    }
  }

  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">WeddChance</span>
          <h2>Anulowane wydarzenia i oferty</h2>
          <p>Po prosbie o anulacje manager decyduje, czy usuwa wydarzenie, czy zamienia termin na oferte WeddChance.</p>
        </div>
      </div>

      <div className="partner-dashboard__smartplanner-layout">
        <div className="partner-dashboard__smartplanner-list">
          {listState.status === 'loading' ? (
            <div className="partner-dashboard__placeholder-panel">
              <strong>Ladowanie anulacji</strong>
              <span>Trwa pobieranie listy anulowanych wydarzen.</span>
            </div>
          ) : null}
          {listState.status === 'error' ? <p className="partner-dashboard__error">{listState.error}</p> : null}
          {listState.status === 'ready' && items.length === 0 ? (
            <div className="partner-dashboard__placeholder-panel">
              <strong>Brak anulacji</strong>
              <span>Aktualnie nie ma prosb o anulacje do rozpatrzenia.</span>
            </div>
          ) : null}

          {items.map((booking) => (
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
          ))}
        </div>

        <div className="partner-dashboard__smartplanner-detail">
          {detailState.status === 'loading' ? (
            <div className="partner-dashboard__placeholder-panel">
              <strong>Ladowanie szczegolow</strong>
              <span>Trwa pobieranie szczegolow anulacji.</span>
            </div>
          ) : null}
          {detailState.status === 'error' ? <p className="partner-dashboard__error">{detailState.error}</p> : null}

          {detailState.status === 'ready' && detailState.booking ? (
            <>
              <article className="partner-dashboard__smartplanner-card">
                <div className="partner-dashboard__workspace-header">
                  <div>
                    <span className="partner-dashboard__workspace-eyebrow">Prośba o anulowanie</span>
                    <h2>{detailState.booking.venueName}</h2>
                    <p>{formatDate(detailState.booking.eventDate)} | {detailState.booking.clientFirstName || '-'} {detailState.booking.clientLastName || ''}</p>
                  </div>
                  <span className={`partner-dashboard__status-badge partner-dashboard__status-badge--${detailState.booking.status.toLowerCase()}`}>
                    {formatSmartPlannerStatus(detailState.booking.status)}
                  </span>
                </div>
              </article>

              <article className="partner-dashboard__smartplanner-card">
                <div className="partner-dashboard__feedback-panel partner-dashboard__feedback-panel--compact">
                  <strong>Powod klienta</strong>
                  <p>{detailState.booking.clientRequestNotes || 'Brak uzasadnienia.'}</p>
                </div>
              </article>

              <article className="partner-dashboard__smartplanner-card">
                <form className="partner-dashboard__form" onSubmit={(event) => void handleSubmit(event)}>
                  <label className="partner-dashboard__field">
                    <span>Decyzja</span>
                    <select
                      className="partner-dashboard__select"
                      value={form.decision}
                      onChange={(event) => setForm((current) => ({ ...current, decision: event.target.value }))}
                    >
                      <option value="APPROVE_CANCELLATION_WEDDCHANCE">Stworz WeddChance</option>
                      <option value="APPROVE_CANCELLATION_REMOVE">Usun wydarzenie</option>
                      <option value="REJECT_CANCELLATION">Odrzuc anulacje</option>
                    </select>
                  </label>

                  <label className="partner-dashboard__field">
                    <span>Rabat %</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discountPercentage}
                      disabled={!canCreateWeddChance}
                      onChange={(event) => handleDiscountChange(event.target.value)}
                    />
                  </label>

                  <label className="partner-dashboard__field">
                    <span>Cena specjalna / osoba</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.specialPricePerGuest}
                      disabled={!canCreateWeddChance}
                      onChange={(event) => handleSpecialPriceChange(event.target.value)}
                    />
                  </label>

                  <label className="partner-dashboard__field">
                    <span>Elastyczna liczba gosci</span>
                    <select
                      className="partner-dashboard__select"
                      value={form.allowGuestCountAdjustment}
                      disabled={!canCreateWeddChance}
                      onChange={(event) => setForm((current) => ({ ...current, allowGuestCountAdjustment: event.target.value }))}
                    >
                      <option value="false">Nie</option>
                      <option value="true">Tak</option>
                    </select>
                  </label>

                  <label className="partner-dashboard__field">
                    <span>Min gosci</span>
                    <input
                      type="number"
                      min="1"
                      value={form.minGuestCount}
                      disabled={!canCreateWeddChance || form.allowGuestCountAdjustment !== 'true'}
                      onChange={(event) => setForm((current) => ({ ...current, minGuestCount: event.target.value }))}
                    />
                  </label>

                  <label className="partner-dashboard__field">
                    <span>Max gosci</span>
                    <input
                      type="number"
                      min="1"
                      value={form.maxGuestCount}
                      disabled={!canCreateWeddChance || form.allowGuestCountAdjustment !== 'true'}
                      onChange={(event) => setForm((current) => ({ ...current, maxGuestCount: event.target.value }))}
                    />
                  </label>

                  <label className="partner-dashboard__field partner-dashboard__field--full">
                    <span>Opis oferty</span>
                    <textarea
                      rows="4"
                      value={form.dealDescription}
                      disabled={!canCreateWeddChance}
                      onChange={(event) => setForm((current) => ({ ...current, dealDescription: event.target.value }))}
                    />
                  </label>

                  <label className="partner-dashboard__field partner-dashboard__field--full">
                    <span>Komentarz managera</span>
                    <textarea
                      rows="4"
                      value={form.comment}
                      onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
                    />
                  </label>

                  {submitState.status === 'error' ? <p className="partner-dashboard__error">{submitState.error}</p> : null}
                  {submitState.status === 'success' ? <p className="partner-dashboard__notice">Decyzja zostala zapisana.</p> : null}

                  <div className="partner-dashboard__edit-actions">
                    <button type="submit" className="partner-dashboard__submit" disabled={submitState.status === 'loading'}>
                      {submitState.status === 'loading' ? 'Zapisywanie...' : 'Zapisz decyzje'}
                    </button>
                  </div>
                </form>
              </article>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default WeddChanceManagementView
