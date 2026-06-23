export const SMART_PLANNER_STATUS_LABELS = {
  SUBMITTED: 'Oczekujace',
  APPROVED: 'Zatwierdzone',
  CHANGE_REQUESTED: 'Zmiana do akceptacji',
  CANCELLATION_REQUESTED: 'Prośba o anulowanie',
  REJECTED: 'Odrzucone',
  EXPIRED: 'Wygasle',
  CANCELLED: 'Anulowane',
}

export const SMART_PLANNER_STATUS_OPTIONS = [
  { value: '', label: 'Wszystkie statusy' },
  { value: 'SUBMITTED', label: SMART_PLANNER_STATUS_LABELS.SUBMITTED },
  { value: 'APPROVED', label: SMART_PLANNER_STATUS_LABELS.APPROVED },
  { value: 'CHANGE_REQUESTED', label: SMART_PLANNER_STATUS_LABELS.CHANGE_REQUESTED },
  { value: 'CANCELLATION_REQUESTED', label: SMART_PLANNER_STATUS_LABELS.CANCELLATION_REQUESTED },
  { value: 'REJECTED', label: SMART_PLANNER_STATUS_LABELS.REJECTED },
  { value: 'EXPIRED', label: SMART_PLANNER_STATUS_LABELS.EXPIRED },
  { value: 'CANCELLED', label: SMART_PLANNER_STATUS_LABELS.CANCELLED },
]

export function formatSmartPlannerStatus(status) {
  return SMART_PLANNER_STATUS_LABELS[status] ?? status
}
