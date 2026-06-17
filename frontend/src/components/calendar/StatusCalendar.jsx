import './StatusCalendar.css'

const WEEKDAY_LABELS = ['Pn', 'Wt', 'Sr', 'Cz', 'Pt', 'So', 'Nd']

const STATUS_LABELS = {
  AVAILABLE: 'Dostepny',
  PROVISIONAL: 'Wstepna blokada',
  CONFIRMED: 'Potwierdzony',
  BLOCKED: 'Niedostepny',
}

function buildCalendarCells(year, month, days) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDayOfMonth = new Date(year, month, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7
  const dayMap = new Map(days.map((day) => [day.date, day]))
  const cells = []

  for (let index = 0; index < startOffset; index += 1) {
    cells.push({
      key: `empty-start-${index}`,
      empty: true,
    })
  }

  for (let dayNumber = 1; dayNumber <= lastDayOfMonth; dayNumber += 1) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
    cells.push({
      key: date,
      empty: false,
      dayNumber,
      date,
      status: dayMap.get(date)?.status ?? null,
      provisionalExpiresAt: dayMap.get(date)?.provisionalExpiresAt ?? null,
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `empty-end-${cells.length}`,
      empty: true,
    })
  }

  return cells
}

function StatusCalendar({
  year,
  month,
  days,
  selectedDate = '',
  onSelectDate,
  selectableStatuses = [],
  className = '',
  emptyLabel = 'Brak danych dla tego miesiaca.',
}) {
  const cells = buildCalendarCells(year, month, days)

  return (
    <div className={`status-calendar${className ? ` ${className}` : ''}`}>
      <div className="status-calendar__legend" aria-label="Legenda statusow">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="status-calendar__legend-item">
            <span className={`status-calendar__legend-dot status-calendar__legend-dot--${status.toLowerCase()}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="status-calendar__weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="status-calendar__grid">
        {cells.length > 0 ? cells.map((cell) => {
          if (cell.empty) {
            return <div key={cell.key} className="status-calendar__cell status-calendar__cell--empty" aria-hidden="true" />
          }

          const isSelectable = selectableStatuses.includes(cell.status)
          const isSelected = selectedDate === cell.date

          if (isSelectable && onSelectDate) {
            return (
              <button
                key={cell.key}
                type="button"
                className={`status-calendar__cell status-calendar__cell--interactive status-calendar__cell--${(cell.status ?? 'unknown').toLowerCase()}${isSelected ? ' status-calendar__cell--selected' : ''}`}
                onClick={() => onSelectDate(cell.date)}
              >
                <span className="status-calendar__day-number">{cell.dayNumber}</span>
                <small>{STATUS_LABELS[cell.status] ?? 'Brak statusu'}</small>
              </button>
            )
          }

          return (
            <div
              key={cell.key}
              className={`status-calendar__cell status-calendar__cell--${(cell.status ?? 'unknown').toLowerCase()}${isSelected ? ' status-calendar__cell--selected' : ''}`}
            >
              <span className="status-calendar__day-number">{cell.dayNumber}</span>
              <small>{STATUS_LABELS[cell.status] ?? emptyLabel}</small>
            </div>
          )
        }) : (
          <p className="status-calendar__empty">{emptyLabel}</p>
        )}
      </div>
    </div>
  )
}

export default StatusCalendar
