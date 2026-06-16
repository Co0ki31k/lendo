import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { getDefaultRouteForUser } from '../../lib/navigation'
import './AuthPage.css'

function AuthFormPage({
  eyebrow,
  title,
  subtitle,
  sideTitle,
  sideText,
  sidePoints,
  fields,
  form,
  alternateQuestion,
  alternateActionLabel,
  alternateActionPath,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, startGoogleOAuthLogin, user } = useAuth()
  const defaultRoute = getDefaultRouteForUser(user)
  const returnPath = location.state?.from

  if (isAuthenticated) {
    return <Navigate to={returnPath || defaultRoute} replace />
  }

  async function onSubmit(event) {
    const result = await form.handleSubmit(event)

    if (result.success) {
      navigate(returnPath || getDefaultRouteForUser(result.data?.user), { replace: true })
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__content">
          <span className="auth-card__eyebrow">{eyebrow}</span>
          <h1 className="auth-card__title">{sideTitle}</h1>
          <p className="auth-card__text">{sideText}</p>
          <ul className="auth-card__list">
            {sidePoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <div className="auth-card__aside">
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <div>
              <span className="auth-form__eyebrow">{eyebrow}</span>
              <h2 className="auth-form__title">{title}</h2>
              <p className="auth-form__subtitle">{subtitle}</p>
            </div>

            {form.submitError ? (
              <div className="auth-form__error" role="alert">
                {form.submitError}
              </div>
            ) : null}

            <div className={`auth-form__grid${fields.some((field) => field.halfWidth) ? ' auth-form__grid--double' : ''}`}>
              {fields.map((field) => {
                const hasError = form.touched[field.name] && form.errors[field.name]

                return (
                  <div
                    key={field.name}
                    className={`auth-form__field${field.halfWidth ? '' : ' auth-form__field--full'}`}
                  >
                    <label className="auth-form__label" htmlFor={field.name}>
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      autoComplete={field.autoComplete}
                      placeholder={field.placeholder}
                      value={form.values[field.name]}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                      className={`auth-form__input${hasError ? ' auth-form__input--error' : ''}`}
                    />
                    {hasError ? (
                      <span className="auth-form__field-error" role="alert">
                        {form.errors[field.name]}
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <div className="auth-form__actions">
              <button type="submit" className="auth-form__button" disabled={form.isSubmitting}>
                {form.isSubmitting ? 'Trwa wysylanie...' : title}
              </button>

              <div className="auth-form__divider">lub</div>

              <button
                type="button"
                className="auth-form__oauth"
                disabled={form.isSubmitting}
                onClick={startGoogleOAuthLogin}
              >
                Kontynuuj z Google
              </button>
            </div>

            <p className="auth-form__footer">
              {alternateQuestion}{' '}
              <Link className="auth-form__link" to={alternateActionPath}>
                {alternateActionLabel}
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default AuthFormPage
