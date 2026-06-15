import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLoginForm } from '../../features/auth'
import AuthFormPage from './AuthFormPage.jsx'

const loginFields = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    autoComplete: 'email',
    placeholder: 'anna@przyklad.pl',
  },
  {
    name: 'password',
    label: 'Haslo',
    type: 'password',
    autoComplete: 'current-password',
    placeholder: 'Wpisz haslo',
  },
]

function LoginPage() {
  const form = useLoginForm()
  const [searchParams] = useSearchParams()
  const externalError = useMemo(() => searchParams.get('oauth_error') ?? '', [searchParams])

  return (
    <AuthFormPage
      eyebrow="Logowanie"
      title="Zaloguj sie"
      subtitle="Wejdz do katalogu, ulubionych i dalszych krokow planowania."
      sideTitle="Wroc do swojego planu wesela."
      sideText="Zaloguj sie, aby zarzadzac zapisanymi salami, wracac do formularzy i przechodzic dalej przez proces wyboru oferty."
      sidePoints={[
        'Dostep do zapisanych ulubionych sal.',
        'Szybki powrot do rozpoczetych akcji.',
        'Jeden login dla kont lokalnych i Google.',
      ]}
      fields={loginFields}
      form={form}
      externalError={externalError}
      alternateQuestion="Nie masz jeszcze konta?"
      alternateActionLabel="Zarejestruj sie"
      alternateActionPath="/register"
    />
  )
}

export default LoginPage
