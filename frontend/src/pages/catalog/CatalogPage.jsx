import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { catalogApi } from '../../api'
import './CatalogPage.css'

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

function CatalogPage() {
  const [pageData, setPageData] = useState(null)
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    city: '',
    voivodeship: '',
    maxPricePerGuest: 1500,
  })
  const [draftFilters, setDraftFilters] = useState(filters)

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      setStatus('loading')
      setError('')

      try {
        const response = await catalogApi.getVenues({
          page,
          size: 12,
          city: filters.city || undefined,
          voivodeship: filters.voivodeship || undefined,
          maxPricePerGuest: filters.maxPricePerGuest || undefined,
        })

        if (!isMounted) {
          return
        }

        setPageData(response)
        setStatus('ready')
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        setError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac katalogu sal.')
        setStatus('error')
      }
    }

    void loadCatalog()

    return () => {
      isMounted = false
    }
  }, [filters, page])

  const venues = useMemo(() => pageData?.content ?? [], [pageData])
  const totalPages = pageData?.totalPages ?? 0
  const pageNumber = pageData?.number ?? 0
  const hasPrevious = pageData?.first === false
  const hasNext = pageData?.last === false

  function handleDraftFilterChange(field, value) {
    setDraftFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleApplyFilters(event) {
    event.preventDefault()
    setPage(0)
    setFilters(draftFilters)
  }

  function handleClearFilters() {
    const clearedFilters = {
      city: '',
      voivodeship: '',
      maxPricePerGuest: 1500,
    }

    setDraftFilters(clearedFilters)
    setFilters(clearedFilters)
    setPage(0)
  }

  return (
    <main className="catalog-page">
      <section className="catalog-page__hero">
        <div>
          <span className="catalog-page__eyebrow">Katalog sal</span>
          <h1 className="catalog-page__title">Przegladaj sale weselne</h1>
          <p className="catalog-page__text">
            Lista zaakceptowanych obiektow z podstawowymi informacjami. Wejscie w karte otwiera pelny widok sali.
          </p>
        </div>
      </section>

      {status === 'loading' ? <p className="catalog-page__empty">Ladowanie katalogu...</p> : null}
      {status === 'error' ? <p className="catalog-page__error">{error}</p> : null}

      {status === 'ready' ? (
        <section className="catalog-page__layout">
          <aside className="catalog-page__filters">
            <div className="catalog-page__filters-header">
              <span className="catalog-page__eyebrow">Filtry</span>
              <h2>Zawęź katalog</h2>
            </div>

            <form className="catalog-page__filters-form" onSubmit={handleApplyFilters}>
              <label className="catalog-page__field">
                <span>Maksymalna cena za goscia</span>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="50"
                  value={draftFilters.maxPricePerGuest}
                  onChange={(event) => handleDraftFilterChange('maxPricePerGuest', Number(event.target.value))}
                />
                <strong>{formatPrice(draftFilters.maxPricePerGuest)}</strong>
              </label>

              <label className="catalog-page__field">
                <span>Miasto</span>
                <input
                  type="text"
                  value={draftFilters.city}
                  onChange={(event) => handleDraftFilterChange('city', event.target.value)}
                  placeholder="Np. Lodz"
                />
              </label>

              <label className="catalog-page__field">
                <span>Wojewodztwo</span>
                <input
                  type="text"
                  value={draftFilters.voivodeship}
                  onChange={(event) => handleDraftFilterChange('voivodeship', event.target.value)}
                  placeholder="Np. Lodzkie"
                />
              </label>

              <div className="catalog-page__filter-actions">
                <button type="submit" className="catalog-page__filter-button">
                  Filtruj
                </button>
                <button type="button" className="catalog-page__filter-button catalog-page__filter-button--secondary" onClick={handleClearFilters}>
                  Wyczyść
                </button>
              </div>
            </form>
          </aside>

          <div className="catalog-page__results">
            {venues.length > 0 ? (
              <>
                <section className="catalog-page__list">
                  {venues.map((venue) => (
                    <article key={venue.id} className="catalog-page__card">
                      <button type="button" className="catalog-page__favorite-button" aria-label={`Polub ${venue.name}`}>
                        ♡
                      </button>

                      <Link to={`/venues/${venue.id}`} className="catalog-page__card-link">
                        <div className="catalog-page__card-image-wrap">
                          {venue.primaryImageUrl ? (
                            <img
                              src={venue.primaryImageUrl}
                              alt={venue.name}
                              className="catalog-page__card-image"
                            />
                          ) : (
                            <div className="catalog-page__card-image catalog-page__card-image--fallback">
                              Brak zdjecia
                            </div>
                          )}
                        </div>

                        <div className="catalog-page__card-content">
                          <h2>{venue.name}</h2>
                          <p className="catalog-page__card-location">{venue.city}, {venue.voivodeship}</p>
                        </div>

                        <div className="catalog-page__card-side">
                          <div className="catalog-page__card-stat">
                            <span>Cena od goscia</span>
                            <strong>{formatPrice(venue.basePricePerGuest)}</strong>
                          </div>
                          <div className="catalog-page__card-stat">
                            <span>Maks liczba gosci</span>
                            <strong>{venue.capacityMax ?? '-'}</strong>
                          </div>
                        </div>
                      </Link>

                      <button type="button" className="catalog-page__message-button">
                        Napisz wiadomosc
                      </button>
                    </article>
                  ))}
                </section>

                <div className="catalog-page__pagination">
                  <button
                    type="button"
                    className="catalog-page__pagination-button"
                    disabled={!hasPrevious}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  >
                    Poprzednia
                  </button>
                  <span className="catalog-page__pagination-label">
                    Strona {totalPages === 0 ? 0 : pageNumber + 1} z {totalPages}
                  </span>
                  <button
                    type="button"
                    className="catalog-page__pagination-button"
                    disabled={!hasNext}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Nastepna
                  </button>
                </div>
              </>
            ) : (
              <p className="catalog-page__empty">Brak sal do wyswietlenia.</p>
            )}
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default CatalogPage
