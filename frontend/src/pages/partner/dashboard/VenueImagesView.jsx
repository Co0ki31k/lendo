import VenueImagesManager from './VenueImagesManager.jsx'

function VenueImagesView({ selectedVenue }) {
  return <VenueImagesManager venueId={selectedVenue.id} selectedVenue={selectedVenue} />
}

export default VenueImagesView
