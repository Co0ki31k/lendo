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

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      setStatus('loading')
      setError('')

      try {
        const response = await catalogApi.getVenues({ page, size: 12 })

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
  }, [page])

  const venues = useMemo(() => pageData?.content ?? [], [pageData])
  const totalPages = pageData?.totalPages ?? 0
  const pageNumber = pageData?.number ?? 0
  const hasPrevious = pageData?.first === false
  const hasNext = pageData?.last === false

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
        venues.length > 0 ? (
          <>
            <section className="catalog-page__list">
              {venues.map((venue) => (
                <Link key={venue.id} to={`/venues/${venue.id}`} className="catalog-page__card">
                  <div className="catalog-page__card-content">
                    <h2>{venue.name}</h2>
                    <p className="catalog-page__card-location">{venue.city}, {venue.voivodeship}</p>
                    <div className="catalog-page__card-meta">
                      <div>
                        <span>Cena od goscia</span>
                        <strong>{formatPrice(venue.basePricePerGuest)}</strong>
                      </div>
                      <div>
                        <span>Maks liczba gosci</span>
                        <strong>{venue.capacityMax ?? '-'}</strong>
                      </div>
                    </div>
                  </div>

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
                </Link>
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
        )
      ) : null}
    </main>
  )
}

export default CatalogPage
