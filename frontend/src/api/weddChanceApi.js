import api from '../lib/api'

export async function getOffers(params = {}) {
  const response = await api.get('/api/weddchance/offers', { params })
  return response.data
}
