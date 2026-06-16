import api from '../lib/api'

export async function getPartnerProfile() {
  const response = await api.get('/api/partner/profile')
  return response.data
}

export async function upsertPartnerProfile(payload) {
  const response = await api.put('/api/partner/profile', payload)
  return response.data
}
