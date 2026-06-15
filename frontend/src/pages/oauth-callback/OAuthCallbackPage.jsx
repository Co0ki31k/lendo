import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOAuthCallback } from '../../features/auth'
import { getDefaultRouteForUser } from '../../lib/navigation'
import '../home/HomePlaceholder.css'

function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { status, error, user } = useOAuthCallback()

  useEffect(() => {
    if (status === 'success') {
      navigate(getDefaultRouteForUser(user), { replace: true })
    }
  }, [navigate, status, user])

  return (
    <main className="home-placeholder">
      <section className="home-placeholder__card">
        <span className="home-placeholder__eyebrow">OAuth</span>
        <h1 className="home-placeholder__title">Finalizacja logowania</h1>
        <p className="home-placeholder__text">
          {status === 'error'
            ? error || 'Nie udalo sie dokonczyc logowania Google.'
            : 'Trwa finalizacja logowania Google.'}
        </p>
      </section>
    </main>
  )
}

export default OAuthCallbackPage
