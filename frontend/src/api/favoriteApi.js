import api from '../lib/api'

export async function getFavorites() {
  const response = await api.get('/api/user/favorites')
  return response.data
}

export async function addFavorite(venueId) {
  const response = await api.put(`/api/user/favorites/${venueId}`)
  return response.data
}

export async function removeFavorite(venueId) {
  await api.delete(`/api/user/favorites/${venueId}`)
}
