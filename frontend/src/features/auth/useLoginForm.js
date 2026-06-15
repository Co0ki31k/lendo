import { useAuth } from './AuthContext'
import {
  createLoginPayload,
  loginInitialValues,
  validateLoginValues,
} from './authValidation'
import { useAuthForm } from './useAuthForm'

export function useLoginForm() {
  const { login } = useAuth()

  return useAuthForm({
    initialValues: loginInitialValues,
    validate: validateLoginValues,
    submitAction: login,
    mapPayload: createLoginPayload,
  })
}
