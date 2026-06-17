import { useEffect, useMemo, useState } from 'react'
import { partnerApi } from '../../../api'
import StatusCalendar from '../../../components/calendar/StatusCalendar.jsx'

const MONTH_OPTIONS = [
  { value: 1, label: 'Styczen' },
  { value: 2, label: 'Luty' },
  { value: 3, label: 'Marzec' },
  { value: 4, label: 'Kwiecien' },
  { value: 5, label: 'Maj' },
  { value: 6, label: 'Czerwiec' },
  { value: 7, label: 'Lipiec' },
  { value: 8, label: 'Sierpien' },
  { value: 9, label: 'Wrzesien' },
  { value: 10, label: 'Pazdziernik' },
  { value: 11, label: 'Listopad' },
  { value: 12, label: 'Grudzien' },
]

function buildMonthBounds(year, month) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return { from, to }
}

function VenueCalendarView({ selectedVenue }) {
  const today = new Date()
  const [filters, setFilters] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  })
  const [calendarState, setCalendarState] = useState({
    status: 'loading',
    error: '',
    days: [],
  })

  useEffect(() => {
    let isMounted = true
    const { from, to } = buildMonthBounds(filters.year, filters.month)

    async function loadCalendar() {
      setCalendarState({ status: 'loading', error: '', days: [] })

      try {
        const response = await partnerApi.getVenueCalendar(selectedVenue.id, { from, to })

        if (!isMounted) {
          return
        }

        setCalendarState({
          status: 'ready',
          error: '',
          days: response.days ?? [],
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setCalendarState({
          status: 'error',
          error: error.response?.data?.message ?? 'Nie udalo sie pobrac kalendarza obiektu.',
          days: [],
        })
      }
    }

    void loadCalendar()

    return () => {
      isMounted = false
    }
  }, [filters.month, filters.year, selectedVenue.id])

  const statusCounts = useMemo(() => (
    calendarState.days.reduce((accumulator, day) => {
      const key = day.status?.toLowerCase?.() ?? 'unknown'
      return {
        ...accumulator,
        [key]: (accumulator[key] ?? 0) + 1,
      }
    }, {})
  ), [calendarState.days])

  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Obiekt</span>
          <h2>{selectedVenue.name} - Kalendarz</h2>
          <p>Widok miesiaca z oznaczonymi statusami terminow dla wybranego obiektu.</p>
        </div>
      </div>

      <div className="partner-dashboard__toolbar partner-dashboard__toolbar--calendar">
        <select
          className="partner-dashboard__select"
          value={filters.month}
          onChange={(event) => setFilters((current) => ({ ...current, month: Number(event.target.value) }))}
        >
          {MONTH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <input
          className="partner-dashboard__input"
          type="number"
          min={today.getFullYear() - 1}
          max={today.getFullYear() + 5}
          value={filters.year}
          onChange={(event) => setFilters((current) => ({ ...current, year: Number(event.target.value) }))}
        />
      </div>

      <div className="partner-dashboard__stats-grid partner-dashboard__stats-grid--calendar">
        <article className="partner-dashboard__stat-card">
          <span>Dostepne</span>
          <strong>{statusCounts.available ?? 0}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Wstepnie zablokowane</span>
          <strong>{statusCounts.provisional ?? 0}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Potwierdzone</span>
          <strong>{statusCounts.confirmed ?? 0}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Niedostepne</span>
          <strong>{statusCounts.blocked ?? 0}</strong>
        </article>
      </div>

      {calendarState.status === 'loading' ? (
        <div className="partner-dashboard__placeholder-panel">
          <strong>Ladowanie kalendarza</strong>
          <span>Trwa pobieranie statusow dni dla wybranego obiektu.</span>
        </div>
      ) : null}

      {calendarState.status === 'error' ? <p className="partner-dashboard__error">{calendarState.error}</p> : null}

      {calendarState.status === 'ready' ? (
        <div className="partner-dashboard__calendar-card">
          <StatusCalendar
            year={filters.year}
            month={filters.month}
            days={calendarState.days}
            emptyLabel="Brak statusu"
          />
        </div>
      ) : null}
    </section>
  )
}

export default VenueCalendarView
