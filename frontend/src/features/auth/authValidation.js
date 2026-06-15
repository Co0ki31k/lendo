const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const loginInitialValues = {
  email: '',
  password: '',
}

export const registerInitialValues = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
}

function validateEmail(email) {
  if (!email.trim()) {
    return 'Email jest wymagany'
  }

  if (!emailPattern.test(email)) {
    return 'Email powinien byc prawidlowy'
  }

  return null
}

function validatePassword(password) {
  if (!password) {
    return 'Haslo jest wymagane'
  }

  if (password.length < 6) {
    return 'Haslo powinno miec co najmniej 6 znakow'
  }

  return null
}

function validateName(value, fieldLabel) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return `${fieldLabel} jest wymagane`
  }

  if (trimmedValue.length < 2 || trimmedValue.length > 100) {
    return `${fieldLabel} powinno miec od 2 do 100 znakow`
  }

  return null
}

function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    return null
  }

  if (phoneNumber.length > 20) {
    return 'Telefon powinien miec maksymalnie 20 znakow'
  }

  return null
}

export function validateLoginValues(values) {
  const errors = {}

  const emailError = validateEmail(values.email)
  if (emailError) {
    errors.email = emailError
  }

  const passwordError = validatePassword(values.password)
  if (passwordError) {
    errors.password = passwordError
  }

  return errors
}

export function validateRegisterValues(values) {
  const errors = {}

  const emailError = validateEmail(values.email)
  if (emailError) {
    errors.email = emailError
  }

  const passwordError = validatePassword(values.password)
  if (passwordError) {
    errors.password = passwordError
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Potwierdzenie hasla jest wymagane'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Hasla musza byc takie same'
  }

  const firstNameError = validateName(values.firstName, 'Imie')
  if (firstNameError) {
    errors.firstName = firstNameError
  }

  const lastNameError = validateName(values.lastName, 'Nazwisko')
  if (lastNameError) {
    errors.lastName = lastNameError
  }

  const phoneNumberError = validatePhoneNumber(values.phoneNumber)
  if (phoneNumberError) {
    errors.phoneNumber = phoneNumberError
  }

  return errors
}

export function createRegisterPayload(values) {
  return {
    email: values.email.trim(),
    password: values.password,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phoneNumber: values.phoneNumber.trim(),
  }
}

export function createLoginPayload(values) {
  return {
    email: values.email.trim(),
    password: values.password,
  }
}
