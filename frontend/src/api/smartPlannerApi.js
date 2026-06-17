import api from '../lib/api'

export async function searchOffers(payload, params = {}) {
  const response = await api.post('/api/catalog/smart-planner/offers/search', payload, { params })
  return response.data
}

export async function createBooking(payload) {
  const response = await api.post('/api/smart-planner/bookings', payload)
  return response.data
}

export async function getMyBookings(params = {}) {
  const response = await api.get('/api/smart-planner/bookings/me', { params })
  return response.data
}

export async function getBookingDetails(bookingId) {
  const response = await api.get(`/api/smart-planner/bookings/${bookingId}`)
  return response.data
}
