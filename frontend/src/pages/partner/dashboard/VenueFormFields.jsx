function VenueFormFields({
  venueFormValues,
  onVenueChange,
}) {
  return (
    <>
      <label className="partner-dashboard__field">
        <span>Nazwa obiektu</span>
        <input name="name" type="text" value={venueFormValues.name} onChange={onVenueChange} required />
      </label>

      <label className="partner-dashboard__field">
        <span>Styl</span>
        <input name="style" type="text" value={venueFormValues.style} onChange={onVenueChange} required />
      </label>

      <label className="partner-dashboard__field">
        <span>Pojemnosc minimalna</span>
        <input name="capacityMin" type="number" min="1" value={venueFormValues.capacityMin} onChange={onVenueChange} required />
      </label>

      <label className="partner-dashboard__field">
        <span>Pojemnosc maksymalna</span>
        <input name="capacityMax" type="number" min="1" value={venueFormValues.capacityMax} onChange={onVenueChange} required />
      </label>

      <label className="partner-dashboard__field">
        <span>Cena bazowa za goscia</span>
        <input name="basePricePerGuest" type="number" min="0" step="1" value={venueFormValues.basePricePerGuest} onChange={onVenueChange} required />
      </label>

      <label className="partner-dashboard__field">
        <span>Miejsca noclegowe</span>
        <input name="accommodationPlaces" type="number" min="0" value={venueFormValues.accommodationPlaces} onChange={onVenueChange} required />
      </label>

      <label className="partner-dashboard__field">
        <span>Miasto</span>
        <input name="city" type="text" value={venueFormValues.city} onChange={onVenueChange} required />
      </label>

      <label className="partner-dashboard__field">
        <span>Wojewodztwo</span>
        <input name="voivodeship" type="text" value={venueFormValues.voivodeship} onChange={onVenueChange} required />
      </label>

      <label className="partner-dashboard__field partner-dashboard__field--full">
        <span>Ulica</span>
        <input name="street" type="text" value={venueFormValues.street} onChange={onVenueChange} required />
      </label>

      <label className="partner-dashboard__field">
        <span>Kod pocztowy</span>
        <input name="postalCode" type="text" value={venueFormValues.postalCode} onChange={onVenueChange} required />
      </label>

      <label className="partner-dashboard__field partner-dashboard__field--full">
        <span>Opis</span>
        <textarea name="description" value={venueFormValues.description} onChange={onVenueChange} rows="5" />
      </label>

      <div className="partner-dashboard__toggles partner-dashboard__field--full">
        <label className="partner-dashboard__toggle">
          <input name="hasAccommodation" type="checkbox" checked={venueFormValues.hasAccommodation} onChange={onVenueChange} />
          <span>Obiekt ma noclegi</span>
        </label>

        <label className="partner-dashboard__toggle">
          <input name="noCorkageFee" type="checkbox" checked={venueFormValues.noCorkageFee} onChange={onVenueChange} />
          <span>Bez oplaty korkowej</span>
        </label>

        <label className="partner-dashboard__toggle">
          <input name="civilWeddingGarden" type="checkbox" checked={venueFormValues.civilWeddingGarden} onChange={onVenueChange} />
          <span>Slub cywilny w ogrodzie</span>
        </label>
      </div>
    </>
  )
}

export default VenueFormFields
