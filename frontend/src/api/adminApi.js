import api from '../lib/api'

export async function getPartners() {
  const response = await api.get('/api/admin/partners')
  return response.data
}

export async function updatePartnerVerification(userId, verified) {
  const response = await api.patch(`/api/admin/partners/${userId}/verification`, { verified })
  return response.data
}

export async function getVenues() {
  const response = await api.get('/api/admin/venues')
  return response.data
}

export async function updateVenueStatus(venueId, status, comment = '') {
  const response = await api.patch(`/api/admin/venues/${venueId}/status`, { status, comment })
  return response.data
}
