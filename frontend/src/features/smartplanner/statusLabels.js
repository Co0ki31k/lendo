export const SMART_PLANNER_STATUS_LABELS = {
  SUBMITTED: 'Oczekujace',
  APPROVED: 'Zatwierdzone',
  REJECTED: 'Odrzucone',
  EXPIRED: 'Wygasle',
  CANCELLED: 'Anulowane',
}

export const SMART_PLANNER_STATUS_OPTIONS = [
  { value: '', label: 'Wszystkie statusy' },
  { value: 'SUBMITTED', label: SMART_PLANNER_STATUS_LABELS.SUBMITTED },
  { value: 'APPROVED', label: SMART_PLANNER_STATUS_LABELS.APPROVED },
  { value: 'REJECTED', label: SMART_PLANNER_STATUS_LABELS.REJECTED },
  { value: 'EXPIRED', label: SMART_PLANNER_STATUS_LABELS.EXPIRED },
  { value: 'CANCELLED', label: SMART_PLANNER_STATUS_LABELS.CANCELLED },
]

export function formatSmartPlannerStatus(status) {
  return SMART_PLANNER_STATUS_LABELS[status] ?? status
}
