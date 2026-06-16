function StatsView({ venues }) {
  const approvedVenues = venues.filter((venue) => venue.status === 'APPROVED').length
  const pendingVenues = venues.filter((venue) => venue.status === 'PENDING').length
  const draftVenues = venues.filter((venue) => venue.status === 'DRAFT').length

  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Statystyki</span>
          <h2>Podsumowanie konta managera</h2>
          <p>To jest domyslny widok dashboardu. Tu zepniemy pozniej bardziej rozbudowane statystyki i raporty.</p>
        </div>
      </div>

      <div className="partner-dashboard__stats-grid">
        <article className="partner-dashboard__stat-card">
          <span>Wszystkie obiekty</span>
          <strong>{venues.length}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Zatwierdzone</span>
          <strong>{approvedVenues}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Oczekujace</span>
          <strong>{pendingVenues}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Szkice</span>
          <strong>{draftVenues}</strong>
        </article>
      </div>

      <div className="partner-dashboard__placeholder-panel">
        <strong>Aktualny focus</strong>
        <span>
          Konto partnera jest zatwierdzone. Kolejne kroki to rozbudowa kalendarza, wiadomosci,
          metryk sprzedazowych i operacyjnych.
        </span>
      </div>
    </section>
  )
}

export default StatsView
