import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { catalogApi, smartPlannerApi } from '../../api'
import './SmartPlannerPage.css'

const STEP_LABELS = [
  'Budzet i goscie',
  'Styl i lokalizacja',
  'Wybor obiektu',
  'Szczegoly zapytania',
]

const STYLE_OPTIONS = [
  '',
  'Rustykalny',
  'Glamour',
  'Boho',
  'Klasyczny',
  'Nowoczesny',
  'Palacowy',
  'Stodola',
]

const VOIVODESHIP_OPTIONS = [
  '',
  'Dolnoslaskie',
  'Kujawsko-Pomorskie',
  'Lubelskie',
  'Lubuskie',
  'Lodzkie',
  'Malopolskie',
  'Mazowieckie',
  'Opolskie',
  'Podkarpackie',
  'Podlaskie',
  'Pomorskie',
  'Slaskie',
  'Swietokrzyskie',
  'Warminsko-Mazurskie',
  'Wielkopolskie',
  'Zachodniopomorskie',
]

function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '-'
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function buildMonthBounds(year, month) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return { from, to }
}

function SmartPlannerPage() {
  const today = new Date()
  const [currentStep, setCurrentStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState([0])
  const [form, setForm] = useState({
    estimatedGuests: 100,
    totalBudget: 60000,
    hasAccommodation: '',
    style: '',
    voivodeship: '',
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    venueId: null,
    selectedDate: '',
    fullService: '',
    menuStandardCount: 80,
    menuVegetarianCount: 10,
    menuVeganCount: 5,
    menuGlutenFreeCount: 5,
    allergiesNotes: '',
    serviceNotes: '',
  })
  const [searchState, setSearchState] = useState({
    status: 'idle',
    error: '',
    data: null,
  })
  const [calendarState, setCalendarState] = useState({
    status: 'idle',
    error: '',
    days: [],
  })
  const [submitState, setSubmitState] = useState({
    status: 'idle',
    error: '',
  })

  const maxPricePerGuest = useMemo(() => {
    const guests = Number(form.estimatedGuests)
    const budget = Number(form.totalBudget)

    if (guests <= 0 || budget < 0) {
      return 0
    }

    return Math.round(budget / guests)
  }, [form.estimatedGuests, form.totalBudget])

  const hasSearchPrerequisites = form.estimatedGuests > 0 && maxPricePerGuest > 0 && form.year && form.month

  const effectiveSearchState = hasSearchPrerequisites
    ? searchState
    : { status: 'idle', error: '', data: null }

  const selectedOffer = useMemo(
    () => effectiveSearchState.data?.offers?.find((offer) => offer.id === form.venueId) ?? null,
    [form.venueId, effectiveSearchState.data],
  )

  const effectiveCalendarState = form.venueId && selectedOffer
    ? calendarState
    : { status: 'idle', error: '', days: [] }

  const availableDays = useMemo(
    () => effectiveCalendarState.days.filter((day) => day.status === 'AVAILABLE'),
    [effectiveCalendarState.days],
  )

  useEffect(() => {
    if (!hasSearchPrerequisites) {
      return
    }

    let isMounted = true

    async function loadOffers() {
      setSearchState((current) => ({ ...current, status: 'loading', error: '' }))

      try {
        const response = await smartPlannerApi.searchOffers({
          estimatedGuests: Number(form.estimatedGuests),
          maxPricePerGuest: Number(maxPricePerGuest),
          style: form.style || null,
          hasAccommodation: form.hasAccommodation === '' ? null : form.hasAccommodation === 'true',
          voivodeship: form.voivodeship || null,
          year: Number(form.year),
          month: Number(form.month),
        }, {
          page: 0,
          size: 12,
        })

        if (!isMounted) {
          return
        }

        setSearchState({
          status: 'ready',
          error: '',
          data: response,
        })

        const stillExists = response.offers.some((offer) => offer.id === form.venueId)
        if (!stillExists && form.venueId != null) {
          setForm((current) => ({
            ...current,
            venueId: null,
            selectedDate: '',
          }))
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        setSearchState({
          status: 'error',
          error: error.response?.data?.message ?? 'Nie udalo sie pobrac dopasowanych obiektow.',
          data: null,
        })
      }
    }

    void loadOffers()

    return () => {
      isMounted = false
    }
  }, [
    form.estimatedGuests,
    form.style,
    form.hasAccommodation,
    form.voivodeship,
    form.year,
    form.month,
    form.venueId,
    hasSearchPrerequisites,
    maxPricePerGuest,
  ])

  useEffect(() => {
    if (!selectedOffer) {
      return
    }

    let isMounted = true
    const { from, to } = buildMonthBounds(form.year, form.month)

    async function loadCalendar() {
      setCalendarState({ status: 'loading', error: '', days: [] })

      try {
        const response = await catalogApi.getVenueCalendar(selectedOffer.id, { from, to })

        if (!isMounted) {
          return
        }

        setCalendarState({
          status: 'ready',
          error: '',
          days: response.days ?? [],
        })

        const selectedStillAvailable = (response.days ?? []).some(
          (day) => day.date === form.selectedDate && day.status === 'AVAILABLE',
        )

        if (!selectedStillAvailable && form.selectedDate) {
          setForm((current) => ({
            ...current,
            selectedDate: '',
          }))
        }
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
  }, [selectedOffer, form.year, form.month, form.selectedDate])

  function handleFieldChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function moveToStep(stepIndex) {
    setCurrentStep(stepIndex)
    setVisitedSteps((current) => (current.includes(stepIndex) ? current : [...current, stepIndex]))
  }

  function goNext() {
    if (currentStep < STEP_LABELS.length - 1) {
      moveToStep(currentStep + 1)
    }
  }

  function goBack() {
    if (currentStep > 0) {
      setCurrentStep((current) => current - 1)
    }
  }

  function canGoNext() {
    if (currentStep === 0) {
      return Number(form.estimatedGuests) > 0 && Number(form.totalBudget) > 0
    }

    if (currentStep === 1) {
      return Number(form.year) > 0 && Number(form.month) > 0
    }

    if (currentStep === 2) {
      return Boolean(form.venueId)
    }

    return false
  }

  async function handleSubmit() {
    setSubmitState({ status: 'loading', error: '' })

    try {
      await smartPlannerApi.createBooking({
        venueId: form.venueId,
        eventDate: form.selectedDate,
        maxPricePerGuest: Number(maxPricePerGuest),
        fullService: form.fullService === 'true',
        estimatedGuests: Number(form.estimatedGuests),
        menuStandardCount: Number(form.menuStandardCount),
        menuVegetarianCount: Number(form.menuVegetarianCount),
        menuVeganCount: Number(form.menuVeganCount),
        menuGlutenFreeCount: Number(form.menuGlutenFreeCount),
        allergiesNotes: form.allergiesNotes || null,
        serviceNotes: form.serviceNotes || null,
      })

      setSubmitState({ status: 'success', error: '' })
    } catch (error) {
      setSubmitState({
        status: 'error',
        error: error.response?.data?.message ?? 'Nie udalo sie wyslac formularza do managera.',
      })
    }
  }

  const summaryItems = [
    {
      label: 'Budzet',
      value: Number(form.totalBudget) > 0 ? formatCurrency(form.totalBudget) : 'Nie podano',
      enabled: visitedSteps.includes(0),
    },
    {
      label: 'Liczba gosci',
      value: Number(form.estimatedGuests) > 0 ? `${form.estimatedGuests} osob` : 'Nie podano',
      enabled: visitedSteps.includes(0),
    },
    {
      label: 'Styl',
      value: form.style || 'Dowolny',
      enabled: visitedSteps.includes(1),
    },
    {
      label: 'Noclegi',
      value: form.hasAccommodation === '' ? 'Bez preferencji' : form.hasAccommodation === 'true' ? 'Wymagane' : 'Niepotrzebne',
      enabled: visitedSteps.includes(1),
    },
    {
      label: 'Service',
      value: form.fullService === '' ? 'Nie wybrano' : form.fullService === 'true' ? 'Full service' : 'Bez full service',
      enabled: visitedSteps.includes(3),
    },
  ]

  return (
    <main className="smartplanner-page">
      <section className="smartplanner-page__hero">
        <div>
          <span className="smartplanner-page__eyebrow">SmartPlanner</span>
          <h1 className="smartplanner-page__title">Zbuduj shortlistę i wyslij booking do managera</h1>
          <p className="smartplanner-page__text">
            Przechodzisz przez cztery kroki. Wyniki po prawej odswiezaja sie automatycznie po kazdej zmianie filtra.
          </p>
        </div>
      </section>

      <section className="smartplanner-page__layout">
        <div className="smartplanner-page__wizard">
          <header className="smartplanner-page__steps" aria-label="Postep formularza">
            {STEP_LABELS.map((label, index) => (
              <button
                key={label}
                type="button"
                className={`smartplanner-page__step${index === currentStep ? ' smartplanner-page__step--active' : ''}${visitedSteps.includes(index) ? ' smartplanner-page__step--visited' : ''}`}
                onClick={() => {
                  if (visitedSteps.includes(index)) {
                    setCurrentStep(index)
                  }
                }}
                disabled={!visitedSteps.includes(index)}
              >
                <span>{index + 1}</span>
                <strong>{label}</strong>
              </button>
            ))}
          </header>

          <section className="smartplanner-page__panel">
            {currentStep === 0 ? (
              <div className="smartplanner-page__section">
                <div className="smartplanner-page__section-header">
                  <span className="smartplanner-page__eyebrow">Krok 1</span>
                  <h2>Budzet i liczba gosci</h2>
                </div>

                <div className="smartplanner-page__field-grid">
                  <label className="smartplanner-page__field">
                    <span>Szacowana liczba gosci</span>
                    <input
                      type="number"
                      min="1"
                      value={form.estimatedGuests}
                      onChange={(event) => handleFieldChange('estimatedGuests', Number(event.target.value))}
                    />
                  </label>

                  <label className="smartplanner-page__field">
                    <span>Budzet calkowity</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={form.totalBudget}
                      onChange={(event) => handleFieldChange('totalBudget', Number(event.target.value))}
                    />
                  </label>
                </div>

                <div className="smartplanner-page__metric">
                  <span>Maksymalna cena na osobe</span>
                  <strong>{formatCurrency(maxPricePerGuest)}</strong>
                </div>
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div className="smartplanner-page__section">
                <div className="smartplanner-page__section-header">
                  <span className="smartplanner-page__eyebrow">Krok 2</span>
                  <h2>Styl, lokalizacja i miesiac</h2>
                </div>

                <div className="smartplanner-page__field-grid">
                  <label className="smartplanner-page__field">
                    <span>Preferowany styl</span>
                    <select value={form.style} onChange={(event) => handleFieldChange('style', event.target.value)}>
                      {STYLE_OPTIONS.map((option) => (
                        <option key={option || 'all'} value={option}>{option || 'Dowolny'}</option>
                      ))}
                    </select>
                  </label>

                  <label className="smartplanner-page__field">
                    <span>Wojewodztwo</span>
                    <select value={form.voivodeship} onChange={(event) => handleFieldChange('voivodeship', event.target.value)}>
                      {VOIVODESHIP_OPTIONS.map((option) => (
                        <option key={option || 'all'} value={option}>{option || 'Dowolne'}</option>
                      ))}
                    </select>
                  </label>

                  <label className="smartplanner-page__field">
                    <span>Noclegi</span>
                    <select value={form.hasAccommodation} onChange={(event) => handleFieldChange('hasAccommodation', event.target.value)}>
                      <option value="">Bez preferencji</option>
                      <option value="true">Tak</option>
                      <option value="false">Nie</option>
                    </select>
                  </label>

                  <label className="smartplanner-page__field">
                    <span>Rok</span>
                    <input
                      type="number"
                      min={today.getFullYear()}
                      max={today.getFullYear() + 5}
                      value={form.year}
                      onChange={(event) => handleFieldChange('year', Number(event.target.value))}
                    />
                  </label>

                  <label className="smartplanner-page__field">
                    <span>Miesiac</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={form.month}
                      onChange={(event) => handleFieldChange('month', Number(event.target.value))}
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="smartplanner-page__section">
                <div className="smartplanner-page__section-header">
                  <span className="smartplanner-page__eyebrow">Krok 3</span>
                  <h2>Wybierz obiekt z dopasowania</h2>
                </div>

                {effectiveSearchState.status === 'loading' ? <p className="smartplanner-page__notice">Odswiezanie shortlisty...</p> : null}
                {effectiveSearchState.status === 'error' ? <p className="smartplanner-page__error">{effectiveSearchState.error}</p> : null}

                <div className="smartplanner-page__offers">
                  {(effectiveSearchState.data?.offers ?? []).map((offer) => (
                    <button
                      key={offer.id}
                      type="button"
                      className={`smartplanner-page__offer${form.venueId === offer.id ? ' smartplanner-page__offer--selected' : ''}`}
                      onClick={() => handleFieldChange('venueId', offer.id)}
                    >
                      <div className="smartplanner-page__offer-media">
                        {offer.primaryImageUrl ? (
                          <img src={offer.primaryImageUrl} alt={offer.name} />
                        ) : (
                          <div className="smartplanner-page__offer-fallback">Brak zdjecia</div>
                        )}
                      </div>
                      <div className="smartplanner-page__offer-body">
                        <div className="smartplanner-page__offer-topline">
                          <h3>{offer.name}</h3>
                          <strong>{formatCurrency(offer.basePricePerGuest)}</strong>
                        </div>
                        <p>{offer.city}, {offer.voivodeship}</p>
                        <div className="smartplanner-page__offer-tags">
                          <span>{offer.style}</span>
                          <span>{offer.capacityMin}-{offer.capacityMax} osob</span>
                          <span>{offer.hasAccommodation ? `Noclegi: ${offer.accommodationPlaces}` : 'Bez noclegow'}</span>
                        </div>
                        <small>Dostepnych dni w miesiacu: {offer.availableDatesCount}</small>
                      </div>
                    </button>
                  ))}
                </div>

                {effectiveSearchState.status === 'ready' && (effectiveSearchState.data?.offers?.length ?? 0) === 0 ? (
                  <p className="smartplanner-page__notice">Brak obiektow dla tych filtrow. Zmien kryteria po lewej stronie.</p>
                ) : null}
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="smartplanner-page__section">
                <div className="smartplanner-page__section-header">
                  <span className="smartplanner-page__eyebrow">Krok 4</span>
                  <h2>Data, service i konfiguracja menu</h2>
                </div>

                {selectedOffer ? (
                  <div className="smartplanner-page__selected-offer">
                    <strong>{selectedOffer.name}</strong>
                    <span>{selectedOffer.city}, {selectedOffer.voivodeship}</span>
                  </div>
                ) : (
                  <p className="smartplanner-page__notice">Najpierw wybierz obiekt w kroku 3.</p>
                )}

                {selectedOffer ? (
                  <>
                    <div className="smartplanner-page__calendar-block">
                      <div className="smartplanner-page__calendar-header">
                        <h3>Dostepne terminy</h3>
                        <span>{form.month}/{form.year}</span>
                      </div>
                      {effectiveCalendarState.status === 'loading' ? <p className="smartplanner-page__notice">Ladowanie terminow...</p> : null}
                      {effectiveCalendarState.status === 'error' ? <p className="smartplanner-page__error">{effectiveCalendarState.error}</p> : null}
                      <div className="smartplanner-page__date-grid">
                        {availableDays.map((day) => (
                          <button
                            key={day.date}
                            type="button"
                            className={`smartplanner-page__date-button${form.selectedDate === day.date ? ' smartplanner-page__date-button--active' : ''}`}
                            onClick={() => handleFieldChange('selectedDate', day.date)}
                          >
                            {formatDate(day.date)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="smartplanner-page__field-grid">
                      <label className="smartplanner-page__field">
                        <span>Zakres service</span>
                        <select value={form.fullService} onChange={(event) => handleFieldChange('fullService', event.target.value)}>
                          <option value="">Wybierz opcje</option>
                          <option value="true">Full service</option>
                          <option value="false">Bez full service</option>
                        </select>
                      </label>

                      <label className="smartplanner-page__field">
                        <span>Menu standard</span>
                        <input
                          type="number"
                          min="0"
                          value={form.menuStandardCount}
                          onChange={(event) => handleFieldChange('menuStandardCount', Number(event.target.value))}
                        />
                      </label>

                      <label className="smartplanner-page__field">
                        <span>Menu vegetarian</span>
                        <input
                          type="number"
                          min="0"
                          value={form.menuVegetarianCount}
                          onChange={(event) => handleFieldChange('menuVegetarianCount', Number(event.target.value))}
                        />
                      </label>

                      <label className="smartplanner-page__field">
                        <span>Menu vegan</span>
                        <input
                          type="number"
                          min="0"
                          value={form.menuVeganCount}
                          onChange={(event) => handleFieldChange('menuVeganCount', Number(event.target.value))}
                        />
                      </label>

                      <label className="smartplanner-page__field">
                        <span>Menu gluten free</span>
                        <input
                          type="number"
                          min="0"
                          value={form.menuGlutenFreeCount}
                          onChange={(event) => handleFieldChange('menuGlutenFreeCount', Number(event.target.value))}
                        />
                      </label>
                    </div>

                    <label className="smartplanner-page__field smartplanner-page__field--full">
                      <span>Alergie</span>
                      <textarea
                        rows="4"
                        value={form.allergiesNotes}
                        onChange={(event) => handleFieldChange('allergiesNotes', event.target.value)}
                      />
                    </label>

                    <label className="smartplanner-page__field smartplanner-page__field--full">
                      <span>Dodatkowe uwagi</span>
                      <textarea
                        rows="5"
                        value={form.serviceNotes}
                        onChange={(event) => handleFieldChange('serviceNotes', event.target.value)}
                      />
                    </label>

                    {submitState.status === 'error' ? <p className="smartplanner-page__error">{submitState.error}</p> : null}
                    {submitState.status === 'success' ? (
                      <div className="smartplanner-page__success">
                        <span>Formularz zostal wyslany do managera.</span>
                        <Link to="/smartplanner/bookings" className="smartplanner-page__success-link">
                          Przejdz do moich zgloszen
                        </Link>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}
          </section>

          <footer className="smartplanner-page__footer">
            <button
              type="button"
              className="smartplanner-page__nav-button smartplanner-page__nav-button--secondary"
              onClick={goBack}
              disabled={currentStep === 0}
            >
              Wstecz
            </button>

            {currentStep < STEP_LABELS.length - 1 ? (
              <button
                type="button"
                className="smartplanner-page__nav-button"
                onClick={goNext}
                disabled={!canGoNext()}
              >
                Dalej
              </button>
            ) : (
              <button
                type="button"
                className="smartplanner-page__nav-button"
                onClick={() => void handleSubmit()}
                disabled={
                  submitState.status === 'loading'
                  || !form.venueId
                  || !form.selectedDate
                  || form.fullService === ''
                }
              >
                {submitState.status === 'loading' ? 'Wysylanie...' : 'Wyslij do managera'}
              </button>
            )}
          </footer>
        </div>

        <aside className="smartplanner-page__sidebar">
          <section className="smartplanner-page__summary-card">
            <span className="smartplanner-page__eyebrow">Aktualne dopasowanie</span>
            <h2>{effectiveSearchState.data?.summary?.matchedOffers ?? 0} sal spelnia kryteria</h2>
            <p>
              Z {effectiveSearchState.data?.summary?.totalOffers ?? 0} aktualnie dostepnych obiektow w wybranym miesiacu.
            </p>
          </section>

          <section className="smartplanner-page__summary-card">
            <span className="smartplanner-page__eyebrow">Podsumowanie</span>
            <div className="smartplanner-page__summary-list">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className={`smartplanner-page__summary-item${item.enabled ? '' : ' smartplanner-page__summary-item--muted'}`}
                >
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="smartplanner-page__summary-card">
            <span className="smartplanner-page__eyebrow">Wybrany obiekt</span>
            {selectedOffer ? (
              <div className="smartplanner-page__picked-venue">
                <strong>{selectedOffer.name}</strong>
                <span>{selectedOffer.city}, {selectedOffer.voivodeship}</span>
                <span>{formatCurrency(selectedOffer.basePricePerGuest)} / osoba</span>
                <span>{form.selectedDate ? formatDate(form.selectedDate) : 'Termin jeszcze nie wybrany'}</span>
              </div>
            ) : (
              <p className="smartplanner-page__notice">Nie wybrano jeszcze sali.</p>
            )}
          </section>
        </aside>
      </section>
    </main>
  )
}

export default SmartPlannerPage
