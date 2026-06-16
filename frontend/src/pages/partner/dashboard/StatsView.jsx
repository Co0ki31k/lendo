function StatsView({ summary }) {
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
          <strong>{summary.total}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Zatwierdzone</span>
          <strong>{summary.approved}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Oczekujace</span>
          <strong>{summary.pending}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Do poprawy</span>
          <strong>{summary.draft}</strong>
        </article>
        <article className="partner-dashboard__stat-card">
          <span>Odrzucone</span>
          <strong>{summary.rejected}</strong>
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
