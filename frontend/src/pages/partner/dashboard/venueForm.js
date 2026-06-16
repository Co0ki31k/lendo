export function createVenueFormValues(source = {}) {
  return {
    name: source.name ?? '',
    description: source.description ?? '',
    style: source.style ?? '',
    capacityMin: source.capacityMin != null ? String(source.capacityMin) : '80',
    capacityMax: source.capacityMax != null ? String(source.capacityMax) : '120',
    hasAccommodation: Boolean(source.hasAccommodation),
    accommodationPlaces: source.accommodationPlaces != null ? String(source.accommodationPlaces) : '0',
    basePricePerGuest: source.basePricePerGuest != null ? String(source.basePricePerGuest) : '0',
    noCorkageFee: Boolean(source.noCorkageFee),
    civilWeddingGarden: Boolean(source.civilWeddingGarden),
    street: source.street ?? source.address?.street ?? '',
    city: source.city ?? source.address?.city ?? '',
    postalCode: source.postalCode ?? source.address?.postalCode ?? '',
    voivodeship: source.voivodeship ?? source.address?.voivodeship ?? '',
    latitude: source.latitude != null ? String(source.latitude) : source.address?.latitude != null ? String(source.address.latitude) : '',
    longitude: source.longitude != null ? String(source.longitude) : source.address?.longitude != null ? String(source.address.longitude) : '',
  }
}

export function buildVenuePayload(values) {
  return {
    ...values,
    capacityMin: Number(values.capacityMin),
    capacityMax: Number(values.capacityMax),
    accommodationPlaces: Number(values.accommodationPlaces),
    basePricePerGuest: Number(values.basePricePerGuest),
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
  }
}
