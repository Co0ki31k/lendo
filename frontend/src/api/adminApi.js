import api from '../lib/api'

export async function getPartners(params = {}) {
  const response = await api.get('/api/admin/partners', { params })
  return response.data
}

export async function updatePartnerVerification(userId, verified) {
  const response = await api.patch(`/api/admin/partners/${userId}/verification`, { verified })
  return response.data
}

export async function deletePartner(userId) {
  await api.delete(`/api/admin/partners/${userId}`)
}

export async function getUsers(params = {}) {
  const response = await api.get('/api/admin/users', { params })
  return response.data
}

export async function updateUserRole(userId, role) {
  const response = await api.patch(`/api/admin/users/${userId}/role`, { role })
  return response.data
}

export async function deleteUser(userId) {
  await api.delete(`/api/admin/users/${userId}`)
}

export async function getVenues(params = {}) {
  const response = await api.get('/api/admin/venues', { params })
  return response.data
}

export async function updateVenueStatus(venueId, status, comment = '') {
  const response = await api.patch(`/api/admin/venues/${venueId}/status`, { status, comment })
  return response.data
}

export async function deleteVenue(venueId) {
  await api.delete(`/api/admin/venues/${venueId}`)
}
