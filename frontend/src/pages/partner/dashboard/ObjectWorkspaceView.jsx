import EditVenueView from './EditVenueView.jsx'
import VenueCalendarView from './VenueCalendarView.jsx'
import VenueMessagesView from './VenueMessagesView.jsx'
import VenueImagesView from './VenueImagesView.jsx'

function ObjectWorkspaceView({ selectedVenue, objectView, onVenueUpdated }) {
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

  if (objectView === 'edit') {
    return <EditVenueView selectedVenue={selectedVenue} onVenueUpdated={onVenueUpdated} />
  }

  if (objectView === 'messages') {
    return <VenueMessagesView selectedVenue={selectedVenue} />
  }

  if (objectView === 'images') {
    return <VenueImagesView selectedVenue={selectedVenue} />
  }

  return <VenueCalendarView selectedVenue={selectedVenue} />
}

export default ObjectWorkspaceView
