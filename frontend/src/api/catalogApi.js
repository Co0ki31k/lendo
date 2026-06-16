import api from '../lib/api'

export async function getVenues(params = {}) {
  const response = await api.get('/api/catalog/venues', { params })
  return response.data
}

export async function getVenueDetails(venueId) {
  const response = await api.get(`/api/catalog/venues/${venueId}`)
  return response.data
}

export async function getVenueCalendar(venueId, params = {}) {
  const response = await api.get(`/api/catalog/venues/${venueId}/calendar`, { params })
  return response.data
}

export async function createVenueInquiry(venueId, payload) {
  const response = await api.post(`/api/catalog/venues/${venueId}/inquiries`, payload)
  return response.data
}
