import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { favoriteApi } from '../../api'
import { useAuth } from '../../features/auth'
import './FavoritesPage.css'

function FavoritesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isInitializing } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [activeVenueId, setActiveVenueId] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadFavorites() {
      if (!isAuthenticated) {
        return
      }

      setStatus('loading')
      setError('')

      try {
        const response = await favoriteApi.getFavorites()

        if (!isMounted) {
          return
        }

        setFavorites(response)
        setStatus('ready')
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        setError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac ulubionych obiektow.')
        setStatus('error')
      }
    }

    void loadFavorites()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  async function handleRemoveFavorite(venueId) {
    setActiveVenueId(venueId)

    try {
      await favoriteApi.removeFavorite(venueId)
      setFavorites((current) => current.filter((favorite) => favorite.venueId !== venueId))
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Nie udalo sie usunac obiektu z ulubionych.')
    } finally {
      setActiveVenueId(null)
    }
  }

  if (!isInitializing && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <main className="favorites-page">
      <section className="favorites-page__hero">
        <span className="favorites-page__eyebrow">Ulubione</span>
        <h1>Twoje zapisane obiekty</h1>
        <p>Lista ulubionych sal z szybkim przejsciem do szczegolow i mozliwoscia usuniecia z listy.</p>
      </section>

      {status === 'loading' ? (
        <div className="favorites-page__loading" role="status" aria-live="polite">
          Ladowanie ulubionych...
        </div>
      ) : null}
      {status === 'error' ? <p className="favorites-page__error">{error}</p> : null}

      {status === 'ready' ? (
        favorites.length > 0 ? (
          <section className="favorites-page__list">
            {favorites.map((favorite) => (
              <article key={favorite.id} className="favorites-page__card">
                <button
                  type="button"
                  className="favorites-page__favorite-button favorites-page__favorite-button--active"
                  aria-label={`Usun ${favorite.venueName} z ulubionych`}
                  disabled={activeVenueId === favorite.venueId}
                  onClick={() => void handleRemoveFavorite(favorite.venueId)}
                >
                  ♥
                </button>

                <Link to={`/venues/${favorite.venueId}`} className="favorites-page__card-link">
                  <div className="favorites-page__image-wrap">
                    {favorite.primaryImageUrl ? (
                      <img
                        src={favorite.primaryImageUrl}
                        alt={favorite.venueName}
                        className="favorites-page__image"
                      />
                    ) : (
                      <div className="favorites-page__image favorites-page__image--fallback">Brak zdjecia</div>
                    )}
                  </div>

                  <div className="favorites-page__content">
                    <h2>{favorite.venueName}</h2>
                    <p>{favorite.city}, {favorite.voivodeship}</p>
                  </div>
                </Link>

                <button
                  type="button"
                  className="favorites-page__message-button"
                  onClick={() => navigate(`/venues/${favorite.venueId}`, { state: { focus: 'contact' } })}
                >
                  Napisz wiadomosc
                </button>
              </article>
            ))}
          </section>
        ) : (
          <p className="favorites-page__empty">Nie masz jeszcze zapisanych obiektow.</p>
        )
      ) : null}
    </main>
  )
}

export default FavoritesPage
