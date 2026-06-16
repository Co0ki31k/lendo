import api from '../lib/api'

export async function getCoordinatesFromAddress(payload) {
  const response = await api.post('/api/partner/geocoding/address', payload)
  return response.data
}
