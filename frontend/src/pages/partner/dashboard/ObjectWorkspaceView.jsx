function ObjectWorkspaceView({ selectedVenue, objectView }) {
  if (!selectedVenue) {
    return (
      <section className="partner-dashboard__workspace">
        <div className="partner-dashboard__placeholder-panel">
          <strong>Brak wybranego obiektu</strong>
          <span>Najpierw utworz obiekt albo wybierz go z listy, zeby przejsc do kalendarza, wiadomosci i edycji.</span>
        </div>
      </section>
    )
  }

  const objectViewTitle = objectView === 'calendar'
    ? 'Kalendarz'
    : objectView === 'messages'
      ? 'Wiadomosci'
      : 'Edycja'

  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Obiekt</span>
          <h2>{selectedVenue.name} - {objectViewTitle}</h2>
          <p>
            Aktualnie wybrany obiekt: {selectedVenue.address?.city || '-'}, {selectedVenue.address?.street || '-'}.
            Widoki kalendarza, wiadomosci i edycji przygotowujemy jako osobne moduly.
          </p>
        </div>
      </div>

      <div className="partner-dashboard__placeholder-panel">
        <strong>{objectViewTitle}</strong>
        <span>
          To jest placeholder dla sekcji obiektu. W kolejnym kroku podepniemy tu prawdziwy kalendarz,
          skrzynke wiadomosci i ekran edycji wybranego obiektu.
        </span>
      </div>
    </section>
  )
}

export default ObjectWorkspaceView
