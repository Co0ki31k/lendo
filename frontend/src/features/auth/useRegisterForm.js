import { useAuth } from './AuthContext'
import {
  createRegisterPayload,
  registerInitialValues,
  validateRegisterValues,
} from './authValidation'
import { useAuthForm } from './useAuthForm'

export function useRegisterForm() {
  const { register } = useAuth()

  return useAuthForm({
    initialValues: registerInitialValues,
    validate: validateRegisterValues,
    submitAction: register,
    mapPayload: createRegisterPayload,
  })
}
