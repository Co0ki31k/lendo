import { useEffect, useState } from 'react'
import { weddChanceApi } from '../../api'
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

function WeddChancePage() {
  const [state, setState] = useState({
    status: 'loading',
    error: '',
    data: null,
  })

  useEffect(() => {
    let isMounted = true

    async function loadOffers() {
      setState({ status: 'loading', error: '', data: null })

      try {
        const response = await weddChanceApi.getOffers({ page: 0, size: 12 })

        if (!isMounted) {
          return
        }

        setState({ status: 'ready', error: '', data: response })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setState({
          status: 'error',
          error: error.response?.data?.message ?? 'Nie udalo sie pobrac ofert WeddChance.',
          data: null,
        })
      }
    }

    void loadOffers()

    return () => {
      isMounted = false
    }
  }, [])

  const offers = state.data?.offers?.content ?? []

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
