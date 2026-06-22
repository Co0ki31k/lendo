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

export async function getVenueCalendar(venueId, params = {}) {
  const response = await api.get(`/api/partner/venues/${venueId}/calendar`, { params })
  return response.data
}

export async function updateVenue(venueId, payload) {
  const response = await api.put(`/api/partner/venues/${venueId}`, payload)
  return response.data
}

export async function deleteVenue(venueId) {
  await api.delete(`/api/partner/venues/${venueId}`)
}

export async function getWeddingMenus(params = {}) {
  const response = await api.get('/api/partner/wedding-menus', { params })
  return response.data
}

export async function ensureDefaultWeddingMenus(venueId) {
  await api.post(`/api/partner/wedding-menus/venues/${venueId}/defaults`)
}

export async function updateWeddingMenu(weddingMenuId, payload) {
  const response = await api.put(`/api/partner/wedding-menus/${weddingMenuId}`, payload)
  return response.data
}

export async function getVenueMenuDishes(venueId) {
  const response = await api.get('/api/partner/wedding-menus/dishes', {
    params: { venueId },
  })
  return response.data
}

export async function createVenueDish(venueId, payload) {
  const response = await api.post(`/api/partner/wedding-menus/venues/${venueId}/dishes`, payload)
  return response.data
}

export async function updateVenueDish(venueId, dishId, payload) {
  const response = await api.put(`/api/partner/wedding-menus/venues/${venueId}/dishes/${dishId}`, payload)
  return response.data
}

export async function deleteVenueDish(venueId, dishId) {
  await api.delete(`/api/partner/wedding-menus/venues/${venueId}/dishes/${dishId}`)
}

export async function createMenuDish(weddingMenuId, payload) {
  const response = await api.post(`/api/partner/wedding-menus/${weddingMenuId}/dishes`, payload)
  return response.data
}

export async function updateMenuDish(weddingMenuId, dishId, payload) {
  const response = await api.put(`/api/partner/wedding-menus/${weddingMenuId}/dishes/${dishId}`, payload)
  return response.data
}

export async function deleteMenuDish(weddingMenuId, dishId) {
  await api.delete(`/api/partner/wedding-menus/${weddingMenuId}/dishes/${dishId}`)
}

export async function getMenuIngredients() {
  const response = await api.get('/api/partner/wedding-menus/ingredients')
  return response.data
}

export async function getDishRecipes(weddingMenuId, dishId) {
  const response = await api.get(`/api/partner/wedding-menus/${weddingMenuId}/dishes/${dishId}/recipes`)
  return response.data
}

export async function getVenueDishRecipes(venueId, dishId) {
  const response = await api.get(`/api/partner/wedding-menus/venues/${venueId}/dishes/${dishId}/recipes`)
  return response.data
}

export async function createDishRecipe(weddingMenuId, dishId, payload) {
  const response = await api.post(`/api/partner/wedding-menus/${weddingMenuId}/dishes/${dishId}/recipes`, payload)
  return response.data
}

export async function createVenueDishRecipe(venueId, dishId, payload) {
  const response = await api.post(`/api/partner/wedding-menus/venues/${venueId}/dishes/${dishId}/recipes`, payload)
  return response.data
}

export async function updateDishRecipe(weddingMenuId, dishId, recipeId, payload) {
  const response = await api.put(`/api/partner/wedding-menus/${weddingMenuId}/dishes/${dishId}/recipes/${recipeId}`, payload)
  return response.data
}

export async function updateVenueDishRecipe(venueId, dishId, recipeId, payload) {
  const response = await api.put(`/api/partner/wedding-menus/venues/${venueId}/dishes/${dishId}/recipes/${recipeId}`, payload)
  return response.data
}

export async function deleteDishRecipe(weddingMenuId, dishId, recipeId) {
  await api.delete(`/api/partner/wedding-menus/${weddingMenuId}/dishes/${dishId}/recipes/${recipeId}`)
}

export async function deleteVenueDishRecipe(venueId, dishId, recipeId) {
  await api.delete(`/api/partner/wedding-menus/venues/${venueId}/dishes/${dishId}/recipes/${recipeId}`)
}

export async function submitVenueForReview(venueId) {
  const response = await api.patch(`/api/partner/venues/${venueId}/submit`)
  return response.data
}

export async function getVenueImages(venueId) {
  const response = await api.get(`/api/partner/venues/${venueId}/images`)
  return response.data
}

export async function getVenueInquiries(venueId) {
  const response = await api.get(`/api/partner/venues/${venueId}/inquiries`)
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

export async function getSmartPlannerBookings(params = {}) {
  const response = await api.get('/api/partner/smart-planner/bookings', { params })
  return response.data
}

export async function getSmartPlannerBookingDetails(bookingId) {
  const response = await api.get(`/api/partner/smart-planner/bookings/${bookingId}`)
  return response.data
}

export async function decideSmartPlannerBooking(bookingId, payload) {
  const response = await api.patch(`/api/partner/smart-planner/bookings/${bookingId}/decision`, payload)
  return response.data
}

export async function deleteSmartPlannerBooking(bookingId) {
  await api.delete(`/api/partner/smart-planner/bookings/${bookingId}`)
}
