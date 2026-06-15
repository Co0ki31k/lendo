import { useRegisterForm } from '../../features/auth'
import AuthFormPage from './AuthFormPage.jsx'

const registerFields = [
  {
    name: 'firstName',
    label: 'Imie',
    type: 'text',
    autoComplete: 'given-name',
    placeholder: 'Anna',
    halfWidth: true,
  },
  {
    name: 'lastName',
    label: 'Nazwisko',
    type: 'text',
    autoComplete: 'family-name',
    placeholder: 'Kowalska',
    halfWidth: true,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    autoComplete: 'email',
    placeholder: 'anna@przyklad.pl',
  },
  {
    name: 'phoneNumber',
    label: 'Telefon',
    type: 'tel',
    autoComplete: 'tel',
    placeholder: '+48 500 600 700',
  },
  {
    name: 'password',
    label: 'Haslo',
    type: 'password',
    autoComplete: 'new-password',
    placeholder: 'Ustaw haslo',
    halfWidth: true,
  },
  {
    name: 'confirmPassword',
    label: 'Powtorz haslo',
    type: 'password',
    autoComplete: 'new-password',
    placeholder: 'Powtorz haslo',
    halfWidth: true,
  },
]

function RegisterPage() {
  const form = useRegisterForm()

  return (
    <AuthFormPage
      eyebrow="Rejestracja"
      title="Stworz konto"
      subtitle="Zaloz konto, aby zapisywac oferty i przechodzic dalej przez kolejne etapy."
      sideTitle="Zacznij od konta klienta."
      sideText="Po rejestracji od razu otrzymasz dostep do swojego profilu i mozliwosc dalszej pracy z katalogiem, ulubionymi oraz przyszlymi funkcjami planowania."
      sidePoints={[
        'Szybkie zalozenie konta z emailem lub Google.',
        'Spojny dostep do ulubionych i historii dzialan.',
        'Mozliwosc pozniejszego wejscia do strefy partnera.',
      ]}
      fields={registerFields}
      form={form}
      alternateQuestion="Masz juz konto?"
      alternateActionLabel="Zaloguj sie"
      alternateActionPath="/login"
    />
  )
}

export default RegisterPage
