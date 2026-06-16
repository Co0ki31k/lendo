import api from '../lib/api'

export async function getPartnerProfile() {
  const response = await api.get('/api/partner/profile')
  return response.data
}

export async function upsertPartnerProfile(payload) {
  const response = await api.put('/api/partner/profile', payload)
  return response.data
}

export async function getOwnVenues(params = {}) {
  const response = await api.get('/api/partner/venues', { params })
  return response.data
}

export async function createVenue(payload) {
  const response = await api.post('/api/partner/venues', payload)
  return response.data
}

export async function getVenue(venueId) {
  const response = await api.get(`/api/partner/venues/${venueId}`)
  return response.data
}

export async function updateVenue(venueId, payload) {
  const response = await api.put(`/api/partner/venues/${venueId}`, payload)
  return response.data
}

export async function deleteVenue(venueId) {
  await api.delete(`/api/partner/venues/${venueId}`)
}

export async function submitVenueForReview(venueId) {
  const response = await api.patch(`/api/partner/venues/${venueId}/submit`)
  return response.data
}

export async function getVenueImages(venueId) {
  const response = await api.get(`/api/partner/venues/${venueId}/images`)
  return response.data
}

export async function uploadVenueImage(venueId, { file, displayOrder, primaryImage }) {
  const payload = {
    file,
  }

  if (displayOrder !== '' && displayOrder != null) {
    payload.displayOrder = String(displayOrder)
  }

  if (primaryImage != null) {
    payload.primaryImage = String(primaryImage)
  }

  const response = await api.postForm(`/api/partner/venues/${venueId}/images/upload`, payload, {
    timeout: 120000,
  })

  return response.data
}

export async function deleteVenueImage(venueId, imageId) {
  await api.delete(`/api/partner/venues/${venueId}/images/${imageId}`)
}

export async function updateVenueImageOrder(venueId, items) {
  const response = await api.patch(`/api/partner/venues/${venueId}/images/order`, {
    items,
  })
  return response.data
}
