import { useEffect, useState } from 'react'
import { weddChanceApi } from '../../api'
import { useAuth } from '../../features/auth'
import './WeddChancePage.css'

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

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function WeddChancePage() {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState({
    status: 'loading',
    error: '',
    data: null,
  })
  const [selectedDealId, setSelectedDealId] = useState(null)
  const [submissionForm, setSubmissionForm] = useState({
    guestCount: '',
    message: '',
  })
  const [submitState, setSubmitState] = useState({
    status: 'idle',
    error: '',
    successMessage: '',
  })

  async function loadOffers() {
    setState({ status: 'loading', error: '', data: null })

    try {
      const response = await weddChanceApi.getOffers({ page: 0, size: 12 })
      setState({ status: 'ready', error: '', data: response })
    } catch (error) {
      setState({
        status: 'error',
        error: error.response?.data?.message ?? 'Nie udalo sie pobrac ofert WeddChance.',
        data: null,
      })
    }
  }

  useEffect(() => {
    void loadOffers()
  }, [])

  const offers = state.data?.offers?.content ?? []

  function handleSelectOffer(offer) {
    setSelectedDealId((current) => (current === offer.dealId ? null : offer.dealId))
    setSubmitState({ status: 'idle', error: '', successMessage: '' })
    setSubmissionForm({
      guestCount: offer.allowGuestCountAdjustment ? (offer.originalGuestCount ?? offer.minGuestCount ?? '') : offer.originalGuestCount,
      message: '',
    })
  }

  async function handleSubmitOffer(event, offer) {
    event.preventDefault()

    if (!isAuthenticated) {
      setSubmitState({
        status: 'error',
        error: 'Zaloguj sie, aby wyslac zgloszenie do managera.',
        successMessage: '',
      })
      return
    }

    setSubmitState({ status: 'loading', error: '', successMessage: '' })

    try {
      const response = await weddChanceApi.submitOffer(offer.dealId, {
        guestCount: Number(submissionForm.guestCount),
        message: submissionForm.message.trim() ? submissionForm.message.trim() : null,
      })

      setSubmitState({
        status: 'success',
        error: '',
        successMessage: `Zgloszenie zostalo wyslane. Termin jest wstepnie zablokowany do ${formatDateTime(response.provisionalExpiresAt)}.`,
      })
      setSelectedDealId(null)
      await loadOffers()
    } catch (error) {
      setSubmitState({
        status: 'error',
        error: error.response?.data?.message ?? 'Nie udalo sie wyslac zgloszenia WeddChance.',
        successMessage: '',
      })
    }
  }

  return (
    <main className="weddchance-page">
      <section className="weddchance-page__hero">
        <span className="weddchance-page__eyebrow">WeddChance</span>
        <h1>Oferty last minute</h1>
        <p>Przegladaj terminy po anulowanych wydarzeniach i sprawdz aktualne rabaty dostepne od managerow.</p>
      </section>

      <section className="weddchance-page__summary">
        <article>
          <span>Dostepne oferty</span>
          <strong>{state.data?.totalAvailableOffers ?? 0}</strong>
        </article>
        <article>
          <span>Sredni rabat</span>
          <strong>{state.data?.averageDiscountPercentage ? `${state.data.averageDiscountPercentage}%` : '0%'}</strong>
        </article>
      </section>

      {state.status === 'loading' ? <div className="weddchance-page__notice">Ladowanie ofert...</div> : null}
      {state.status === 'error' ? <p className="weddchance-page__error">{state.error}</p> : null}

      {state.status === 'ready' ? (
        offers.length > 0 ? (
          <section className="weddchance-page__list">
            {offers.map((offer) => (
              <article key={offer.dealId} className="weddchance-page__card">
                <div className="weddchance-page__media">
                  {offer.primaryImageUrl ? (
                    <img src={offer.primaryImageUrl} alt={offer.venueName} />
                  ) : (
                    <div className="weddchance-page__media-fallback">Brak zdjecia</div>
                  )}
                </div>
                <div className="weddchance-page__body">
                  <div className="weddchance-page__topline">
                    <div>
                      <span className="weddchance-page__badge">-{offer.discountPercentage}%</span>
                      <h2>{offer.venueName}</h2>
                      <p>{offer.city}, {offer.voivodeship}</p>
                    </div>
                    <div className="weddchance-page__pricing">
                      <strong>{formatCurrency(offer.specialPricePerGuest)}</strong>
                      <span>zamiast {formatCurrency(offer.originalPricePerGuest)}</span>
                    </div>
                  </div>

                  <div className="weddchance-page__meta">
                    <span>Termin: {formatDate(offer.eventDate)}</span>
                    <span>
                      Goscie:{' '}
                      {offer.allowGuestCountAdjustment
                        ? `${offer.minGuestCount}-${offer.maxGuestCount}`
                        : offer.originalGuestCount}
                    </span>
                  </div>

                  <p className="weddchance-page__description">{offer.description || 'Oferta specjalna utworzona po anulowanym wydarzeniu.'}</p>

                  <div className="weddchance-page__actions">
                    <button
                      type="button"
                      className="weddchance-page__action"
                      onClick={() => handleSelectOffer(offer)}
                    >
                      {selectedDealId === offer.dealId ? 'Zamknij formularz' : 'Wybierz oferte'}
                    </button>
                    {!isAuthenticated ? (
                      <span className="weddchance-page__hint">Zaloguj sie, aby wyslac zgloszenie.</span>
                    ) : null}
                  </div>

                  {selectedDealId === offer.dealId ? (
                    <form className="weddchance-page__form" onSubmit={(event) => void handleSubmitOffer(event, offer)}>
                      <label className="weddchance-page__field">
                        <span>Liczba gosci</span>
                        <input
                          type="number"
                          min={offer.allowGuestCountAdjustment ? offer.minGuestCount ?? 1 : offer.originalGuestCount}
                          max={offer.allowGuestCountAdjustment ? offer.maxGuestCount ?? undefined : offer.originalGuestCount}
                          value={submissionForm.guestCount}
                          disabled={!offer.allowGuestCountAdjustment}
                          onChange={(event) => setSubmissionForm((current) => ({ ...current, guestCount: event.target.value }))}
                        />
                      </label>

                      <label className="weddchance-page__field weddchance-page__field--full">
                        <span>Wiadomosc do managera</span>
                        <textarea
                          rows="4"
                          value={submissionForm.message}
                          onChange={(event) => setSubmissionForm((current) => ({ ...current, message: event.target.value }))}
                          placeholder="Opcjonalnie dopisz kilka szczegolow o wydarzeniu."
                        />
                      </label>

                      {submitState.status === 'error' ? <p className="weddchance-page__error weddchance-page__error--inline">{submitState.error}</p> : null}
                      {submitState.status === 'success' ? <p className="weddchance-page__success">{submitState.successMessage}</p> : null}

                      <button
                        type="submit"
                        className="weddchance-page__action"
                        disabled={submitState.status === 'loading' || !isAuthenticated}
                      >
                        {submitState.status === 'loading' ? 'Wysylanie...' : 'Wyslij zgloszenie'}
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="weddchance-page__notice">Brak aktywnych ofert WeddChance.</div>
        )
      ) : null}
    </main>
  )
}

export default WeddChancePage
