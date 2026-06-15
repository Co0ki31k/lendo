import { useState } from 'react'
import { normalizeAuthError } from './authErrors'

function createTouchedState(values) {
  return Object.keys(values).reduce((result, key) => {
    result[key] = false
    return result
  }, {})
}

function createAllTouchedState(values) {
  return Object.keys(values).reduce((result, key) => {
    result[key] = true
    return result
  }, {})
}

export function useAuthForm({
  initialValues,
  validate,
  submitAction,
  mapPayload = (values) => values,
}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(createTouchedState(initialValues))
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setFieldValue(fieldName, fieldValue) {
    setValues((currentValues) => ({
      ...currentValues,
      [fieldName]: fieldValue,
    }))

    setErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[fieldName]
      return nextErrors
    })
  }

  function setFieldTouched(fieldName, isFieldTouched = true) {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [fieldName]: isFieldTouched,
    }))
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFieldValue(name, value)
  }

  function handleBlur(event) {
    const { name } = event.target
    setFieldTouched(name, true)
  }

  function resetForm(nextValues = initialValues) {
    setValues(nextValues)
    setErrors({})
    setTouched(createTouchedState(nextValues))
    setSubmitError('')
    setIsSubmitting(false)
  }

  async function handleSubmit(event) {
    if (event?.preventDefault) {
      event.preventDefault()
    }

    const nextErrors = validate(values)
    const hasErrors = Object.keys(nextErrors).length > 0

    setTouched(createAllTouchedState(values))
    setErrors(nextErrors)
    setSubmitError('')

    if (hasErrors) {
      return {
        success: false,
        errors: nextErrors,
      }
    }

    try {
      setIsSubmitting(true)
      const result = await submitAction(mapPayload(values))

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      const normalizedError = normalizeAuthError(error)

      setErrors((currentErrors) => ({
        ...currentErrors,
        ...normalizedError.fieldErrors,
      }))
      setSubmitError(normalizedError.message)

      return {
        success: false,
        error: normalizedError,
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    values,
    errors,
    touched,
    submitError,
    isSubmitting,
    setFieldValue,
    setFieldTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  }
}
