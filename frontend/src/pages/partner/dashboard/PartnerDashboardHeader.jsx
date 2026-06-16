function PartnerDashboardHeader({ accountName }) {
  return (
    <header className="partner-dashboard__header">
      <div>
        <span className="partner-dashboard__eyebrow">Dashboard managera</span>
        <h1 className="partner-dashboard__title">{accountName}</h1>
        <p className="partner-dashboard__text">Centrum zarzadzania kontem partnera i obiektami.</p>
      </div>
    </header>
  )
}

export default PartnerDashboardHeader
