import VenueFormFields from './VenueFormFields.jsx'

function CreateVenueView({
  venueFormValues,
  onVenueChange,
  onVenueSubmit,
  isVenueSubmitting,
}) {
  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Nowy obiekt</span>
          <h2>Utworz nowy obiekt</h2>
          <p>Podstawowe dane obiektu. Zdjecia i wysylke do akceptacji podepniemy w kolejnym kroku.</p>
        </div>
      </div>

      <form className="partner-dashboard__form" onSubmit={onVenueSubmit}>
        <VenueFormFields venueFormValues={venueFormValues} onVenueChange={onVenueChange} />

        <button
          type="submit"
          className="partner-dashboard__submit"
          disabled={isVenueSubmitting}
        >
          {isVenueSubmitting ? 'Zapisywanie...' : 'Dodaj obiekt'}
        </button>
      </form>
    </section>
  )
}

export default CreateVenueView
