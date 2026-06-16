export function formatMoney(value) {
  if (value == null) {
    return '-'
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatVenueStatus(status) {
  const labels = {
    PENDING: 'Oczekujacy',
    APPROVED: 'Zaakceptowany',
    REJECTED: 'Odrzucony',
    DRAFT: 'Do poprawy',
  }

  return labels[status] ?? status ?? '-'
}

export function buildAccountName(user) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  return fullName || user?.email || 'Konto managera'
}
