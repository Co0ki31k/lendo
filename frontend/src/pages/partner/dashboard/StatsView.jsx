function formatCurrency(value) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

function formatCompactCurrency(value) {
  const numericValue = Number(value ?? 0)

  if (Math.abs(numericValue) >= 1000) {
    return new Intl.NumberFormat('pl-PL', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(numericValue).replace(/\s/g, '')
  }

  return formatCurrency(numericValue)
}

function formatNumber(value) {
  return new Intl.NumberFormat('pl-PL').format(Number(value ?? 0))
}

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(1)}%`
}

function formatStatus(status) {
  const labels = {
    APPROVED: 'Zatwierdzony',
    PENDING: 'Oczekujacy',
    DRAFT: 'Do poprawy',
    REJECTED: 'Odrzucony',
  }

  return labels[status] ?? status
}

function calculateApprovalRate(stats) {
  if (!stats.bookings.total) {
    return 0
  }

  return (stats.bookings.approved / stats.bookings.total) * 100
}

function StatsView({ stats }) {
  const approvalRate = calculateApprovalRate(stats)

  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Statystyki</span>
          <h2>Podsumowanie konta managera</h2>
          <p>Widok laczy status obiektow, popyt, lejek bookingow i oferty WeddChance w jednym miejscu.</p>
        </div>
      </div>

      <div className="partner-dashboard__stats-grid partner-dashboard__stats-grid--wide">
        <article className="partner-dashboard__stat-card">
          <span>Wszystkie obiekty</span>
          <strong>{formatNumber(stats.kpi.totalVenues)}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Aktywne bookingi</span>
          <strong>{formatNumber(stats.kpi.activeBookings)}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Zapytania</span>
          <strong>{formatNumber(stats.kpi.totalInquiries)}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Ulubione</span>
          <strong>{formatNumber(stats.kpi.totalFavorites)}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Przychod est.</span>
          <strong>{formatCompactCurrency(stats.kpi.approvedEstimatedRevenue)}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Aktywne WeddChance</span>
          <strong>{formatNumber(stats.kpi.activeWeddDeals)}</strong>
        </article>
      </div>

      <div className="partner-dashboard__stats-section">
        <article className="partner-dashboard__smartplanner-card">
          <div className="partner-dashboard__section-heading">
            <h3 className="partner-dashboard__section-title">Trend 6 miesiecy</h3>
            <span className="partner-dashboard__sidebar-meta">Nowe obiekty, bookingi, inquiry i favorites.</span>
          </div>
          <div className="partner-dashboard__trend-grid">
            {stats.monthlyTrends.map((point) => (
              <div key={point.month} className="partner-dashboard__trend-card">
                <strong>{point.month}</strong>
                <dl className="partner-dashboard__trend-metrics">
                  <div><dt>Obiekty</dt><dd>{formatNumber(point.venueCount)}</dd></div>
                  <div><dt>Bookingi</dt><dd>{formatNumber(point.bookingCount)}</dd></div>
                  <div><dt>Inquiry</dt><dd>{formatNumber(point.inquiryCount)}</dd></div>
                  <div><dt>Favorites</dt><dd>{formatNumber(point.favoriteCount)}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="partner-dashboard__stats-panels">
        <article className="partner-dashboard__smartplanner-card">
          <div className="partner-dashboard__section-heading">
            <h3 className="partner-dashboard__section-title">Obiekty</h3>
            <span className="partner-dashboard__sidebar-meta">
              Srednia cena {formatCurrency(stats.venues.averagePricePerGuest)} | pojemnosc {formatNumber(stats.venues.averageCapacityMin)} - {formatNumber(stats.venues.averageCapacityMax)}
            </span>
          </div>
          <dl className="partner-dashboard__venue-meta partner-dashboard__venue-meta--flush">
            <div><dt>Zatwierdzone</dt><dd>{formatNumber(stats.venues.approved)}</dd></div>
            <div><dt>Oczekujace</dt><dd>{formatNumber(stats.venues.pending)}</dd></div>
            <div><dt>Do poprawy</dt><dd>{formatNumber(stats.venues.draft)}</dd></div>
            <div><dt>Odrzucone</dt><dd>{formatNumber(stats.venues.rejected)}</dd></div>
            <div><dt>Z noclegiem</dt><dd>{formatNumber(stats.venues.withAccommodation)}</dd></div>
            <div><dt>Z ogrodem cywilnym</dt><dd>{formatNumber(stats.venues.withCivilWeddingGarden)}</dd></div>
          </dl>

          <div className="partner-dashboard__tag-groups">
            <div>
              <strong className="partner-dashboard__shopping-title">Style</strong>
              <div className="partner-dashboard__tag-list">
                {stats.venues.byStyle.length > 0 ? stats.venues.byStyle.map((item) => (
                  <span key={item.label} className="partner-dashboard__status-badge">
                    {item.label} | {formatNumber(item.count)}
                  </span>
                )) : <span className="partner-dashboard__sidebar-meta">Brak danych.</span>}
              </div>
            </div>
            <div>
              <strong className="partner-dashboard__shopping-title">Wojewodztwa</strong>
              <div className="partner-dashboard__tag-list">
                {stats.venues.byVoivodeship.length > 0 ? stats.venues.byVoivodeship.map((item) => (
                  <span key={item.label} className="partner-dashboard__status-badge">
                    {item.label} | {formatNumber(item.count)}
                  </span>
                )) : <span className="partner-dashboard__sidebar-meta">Brak danych.</span>}
              </div>
            </div>
          </div>
        </article>

        <article className="partner-dashboard__smartplanner-card">
          <div className="partner-dashboard__section-heading">
            <h3 className="partner-dashboard__section-title">Statusy rezerwacji</h3>
            <span className="partner-dashboard__sidebar-meta">
              Wskaznik akceptacji {formatPercent(approvalRate)} | sredni czas decyzji {formatNumber(stats.bookings.averageDecisionHours)} h
            </span>
          </div>
          <dl className="partner-dashboard__venue-meta partner-dashboard__venue-meta--flush">
            <div><dt>Nowe</dt><dd>{formatNumber(stats.bookings.submitted)}</dd></div>
            <div><dt>Zatwierdzone</dt><dd>{formatNumber(stats.bookings.approved)}</dd></div>
            <div><dt>Prosba o zmiane</dt><dd>{formatNumber(stats.bookings.changeRequested)}</dd></div>
            <div><dt>Prosba o anulowanie</dt><dd>{formatNumber(stats.bookings.cancellationRequested)}</dd></div>
            <div><dt>Odrzucone</dt><dd>{formatNumber(stats.bookings.rejected)}</dd></div>
            <div><dt>Wygasle</dt><dd>{formatNumber(stats.bookings.expired)}</dd></div>
            <div><dt>Anulowane</dt><dd>{formatNumber(stats.bookings.cancelled)}</dd></div>
            <div><dt>Srednio gosci</dt><dd>{formatNumber(stats.bookings.averageGuests)}</dd></div>
            <div><dt>Srednia cena / os.</dt><dd>{formatCurrency(stats.bookings.averagePricePerGuest)}</dd></div>
            <div><dt>Total estymacja</dt><dd>{formatCurrency(stats.bookings.totalEstimatedRevenue)}</dd></div>
            <div><dt>Approved estymacja</dt><dd>{formatCurrency(stats.bookings.approvedEstimatedRevenue)}</dd></div>
            <div><dt>Full service</dt><dd>{formatNumber(stats.bookings.fullServiceCount)}</dd></div>
          </dl>

          <div className="partner-dashboard__tag-groups">
            <div>
              <strong className="partner-dashboard__shopping-title">Diety z bookingow</strong>
              <div className="partner-dashboard__tag-list">
                <span className="partner-dashboard__status-badge">Standard | {formatNumber(stats.bookings.dietTotals.standard)}</span>
                <span className="partner-dashboard__status-badge">Vegetarian | {formatNumber(stats.bookings.dietTotals.vegetarian)}</span>
                <span className="partner-dashboard__status-badge">Vegan | {formatNumber(stats.bookings.dietTotals.vegan)}</span>
                <span className="partner-dashboard__status-badge">Gluten free | {formatNumber(stats.bookings.dietTotals.glutenFree)}</span>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="partner-dashboard__stats-panels">
        <article className="partner-dashboard__smartplanner-card">
          <div className="partner-dashboard__section-heading">
            <h3 className="partner-dashboard__section-title">Popyt</h3>
            <span className="partner-dashboard__sidebar-meta">Szybki odczyt zainteresowania Twoimi obiektami.</span>
          </div>
          <div className="partner-dashboard__demand-grid">
            <div className="partner-dashboard__demand-card">
              <span>Zapytania</span>
              <strong>{formatNumber(stats.demand.totalInquiries)}</strong>
            </div>
            <div className="partner-dashboard__demand-card">
              <span>Ulubione</span>
              <strong>{formatNumber(stats.demand.totalFavorites)}</strong>
            </div>
          </div>
        </article>

        <article className="partner-dashboard__smartplanner-card">
          <div className="partner-dashboard__section-heading">
            <h3 className="partner-dashboard__section-title">WeddChance</h3>
            <span className="partner-dashboard__sidebar-meta">Aktywne oferty i ich wykorzystanie.</span>
          </div>
          <dl className="partner-dashboard__venue-meta partner-dashboard__venue-meta--flush">
            <div><dt>Aktywne oferty</dt><dd>{formatNumber(stats.weddChance.activeDeals)}</dd></div>
            <div><dt>Sredni rabat</dt><dd>{formatPercent(stats.weddChance.averageDiscountPercentage)}</dd></div>
            <div><dt>Srednia cena specjalna</dt><dd>{formatCurrency(stats.weddChance.averageSpecialPricePerGuest)}</dd></div>
            <div><dt>Rezerwacje</dt><dd>{formatNumber(stats.weddChance.totalBookings)}</dd></div>
            <div><dt>Estymowany obrot</dt><dd>{formatCurrency(stats.weddChance.totalEstimatedRevenue)}</dd></div>
          </dl>
        </article>
      </div>

      <div className="partner-dashboard__stats-section">
        <article className="partner-dashboard__smartplanner-card">
          <div className="partner-dashboard__section-heading">
            <h3 className="partner-dashboard__section-title">Top obiekty</h3>
            <span className="partner-dashboard__sidebar-meta">Ranking po approved bookingach, revenue i popycie.</span>
          </div>

          {stats.topVenues.length > 0 ? (
            <div className="partner-dashboard__stats-table">
              <div className="partner-dashboard__stats-table-header">
                <span>Obiekt</span>
                <span>Status</span>
                <span>Ulubione</span>
                <span>Zapytania</span>
                <span>Bookingi</span>
                <span>Przychod est.</span>
              </div>
              {stats.topVenues.map((venue) => (
                <div key={venue.venueId} className="partner-dashboard__stats-table-row">
                  <span>
                    <strong>{venue.venueName}</strong>
                    <small>{formatCurrency(venue.basePricePerGuest)}</small>
                  </span>
                  <span>{formatStatus(venue.status)}</span>
                  <span>{formatNumber(venue.favorites)}</span>
                  <span>{formatNumber(venue.inquiries)}</span>
                  <span>{formatNumber(venue.bookings)}</span>
                  <span>{formatCurrency(venue.approvedEstimatedRevenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="partner-dashboard__placeholder-panel">
              <strong>Brak danych rankingowych</strong>
              <span>Obiekty pojawia sie tutaj po pierwszych inquiry, favorites i bookingach.</span>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

export default StatsView
