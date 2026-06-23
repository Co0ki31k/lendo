import api from '../lib/api'

export async function getOffers(params = {}) {
  const response = await api.get('/api/weddchance/offers', { params })
  return response.data
}

export async function submitOffer(dealId, payload) {
  const response = await api.post(`/api/weddchance/offers/${dealId}/submit`, payload)
  return response.data
}
