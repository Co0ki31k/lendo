import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { partnerApi } from '../../api'
import { useAuth } from '../../features/auth'
import './PartnerZonePage.css'

const INITIAL_FORM_VALUES = {
  companyName: '',
  taxId: '',
  contactEmail: '',
  description: '',
}

function PartnerZonePage() {
  const { user, updateCurrentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES)
  const [status, setStatus] = useState('ready')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isManager = user?.role === 'MANAGER'
  const isVerified = Boolean(profile?.verified)
  const isPending = Boolean(isManager && profile && !profile.verified)

  const loadPartnerProfile = useCallback(async () => {
    if (!isManager) {
      return
    }

    setStatus('loading')
    setSubmitError('')

    try {
      const profileResponse = await partnerApi.getPartnerProfile()
      setProfile(profileResponse)
      setFormValues({
        companyName: profileResponse.companyName ?? '',
        taxId: profileResponse.taxId ?? '',
        contactEmail: profileResponse.contactEmail ?? '',
        description: profileResponse.description ?? '',
      })
      setStatus('ready')
    } catch (error) {
      setSubmitError(error.response?.data?.message ?? 'Nie udalo sie pobrac statusu strefy partnera.')
      setStatus('error')
    }
  }, [isManager])

  useEffect(() => {
    if (!isManager) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadPartnerProfile()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isManager, loadPartnerProfile])

  const intro = useMemo(() => {
    if (isVerified) {
      return {
        title: 'Przekierowanie do dashboardu managera',
        text: 'Konto partnera zostalo zatwierdzone. Przenosze do panelu zarzadzania obiektami.',
      }
    }

    if (isPending) {
      return {
        title: 'Wniosek oczekuje na zatwierdzenie',
        text: 'Twoje konto managera zostalo utworzone i czeka na decyzje administratora.',
      }
    }

    return {
      title: 'Zglos chec zostania managerem',
      text: 'Wypelnij formularz partnera. Po wyslaniu konto przejdzie do statusu oczekujacego na zatwierdzenie.',
    }
  }, [isPending, isVerified])

  function handleChange(event) {
    const { name, value } = event.target
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const profileResponse = await partnerApi.upsertPartnerProfile(formValues)
      setProfile(profileResponse)
      updateCurrentUser({ role: 'MANAGER' })
      setStatus('ready')
    } catch (error) {
      setSubmitError(error.response?.data?.message ?? 'Nie udalo sie wyslac formularza partnera.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <main className="partner-zone">
        <section className="partner-zone__panel">
          <p className="partner-zone__empty">Ladowanie strefy partnera...</p>
        </section>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="partner-zone">
        <section className="partner-zone__panel">
          <span className="partner-zone__eyebrow">Strefa partnera</span>
          <h1 className="partner-zone__title">Nie udalo sie pobrac statusu</h1>
          <p className="partner-zone__text">
            Sprobuj odswiezyc strone. Jesli problem sie powtarza, konto partnera moze byc jeszcze niespojnie zapisane.
          </p>
          {submitError ? (
            <p className="partner-zone__error">{submitError}</p>
          ) : null}
        </section>
      </main>
    )
  }

  if (isVerified) {
    return <Navigate to="/partner/dashboard" replace />
  }

  if (isPending) {
    return (
      <main className="partner-zone">
        <section className="partner-zone__panel">
          <span className="partner-zone__eyebrow">Strefa partnera</span>
          <h1 className="partner-zone__title">{intro.title}</h1>
          <p className="partner-zone__text">{intro.text}</p>

          {submitError ? (
            <p className="partner-zone__error">{submitError}</p>
          ) : null}

          <dl className="partner-zone__summary">
            <div>
              <dt>Firma</dt>
              <dd>{profile?.companyName || '-'}</dd>
            </div>
            <div>
              <dt>Email kontaktowy</dt>
              <dd>{profile?.contactEmail || '-'}</dd>
            </div>
            <div>
              <dt>NIP</dt>
              <dd>{profile?.taxId || '-'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Oczekuje na zatwierdzenie</dd>
            </div>
          </dl>
        </section>
      </main>
    )
  }

  return (
    <main className="partner-zone">
      <section className="partner-zone__panel">
        <span className="partner-zone__eyebrow">Strefa partnera</span>
        <h1 className="partner-zone__title">{intro.title}</h1>
        <p className="partner-zone__text">{intro.text}</p>

        {submitError ? (
          <p className="partner-zone__error">{submitError}</p>
        ) : null}

        <form className="partner-zone__form" onSubmit={handleSubmit}>
          <label className="partner-zone__field">
            <span>Nazwa firmy</span>
            <input
              name="companyName"
              type="text"
              value={formValues.companyName}
              onChange={handleChange}
              placeholder="Np. Sala Perla"
              required
            />
          </label>

          <label className="partner-zone__field">
            <span>NIP</span>
            <input
              name="taxId"
              type="text"
              value={formValues.taxId}
              onChange={handleChange}
              placeholder="Np. 1234567890"
            />
          </label>

          <label className="partner-zone__field">
            <span>Email kontaktowy</span>
            <input
              name="contactEmail"
              type="email"
              value={formValues.contactEmail}
              onChange={handleChange}
              placeholder="kontakt@firma.pl"
            />
          </label>

          <label className="partner-zone__field partner-zone__field--full">
            <span>Opis</span>
            <textarea
              name="description"
              value={formValues.description}
              onChange={handleChange}
              rows="5"
              placeholder="Napisz krotko, czym zajmuje sie firma i jakie obiekty prowadzi."
            />
          </label>

          <button type="submit" className="partner-zone__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Wysylanie...' : 'Wyslij zgloszenie'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default PartnerZonePage
