import { useCallback, useEffect, useMemo, useState } from 'react'
import { partnerApi } from '../../../api'

const DISH_CATEGORY_LABELS = {
  PRZYSTAWKA: 'Przystawka',
  ZUPA: 'Zupa',
  DANIE_GLOWNE: 'Danie glowne',
  DESER: 'Deser',
  KOLACJA: 'Kolacja',
}

const UNIT_LABELS = {
  G: 'g',
  ML: 'ml',
  SZT: 'szt.',
}

const EMPTY_DISH_FORM = {
  name: '',
  category: 'PRZYSTAWKA',
}

const EMPTY_RECIPE_FORM = {
  ingredientId: '',
  quantityPerGuest: '',
}

function VenueDishesView({ selectedVenue, onNotice, onError }) {
  const [dishes, setDishes] = useState([])
  const [ingredientCatalog, setIngredientCatalog] = useState([])
  const [recipeItems, setRecipeItems] = useState([])
  const [selectedDishId, setSelectedDishId] = useState(null)
  const [dishForm, setDishForm] = useState(EMPTY_DISH_FORM)
  const [recipeForm, setRecipeForm] = useState(EMPTY_RECIPE_FORM)
  const [editingDishId, setEditingDishId] = useState(null)
  const [editingRecipeId, setEditingRecipeId] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [isSavingDish, setIsSavingDish] = useState(false)
  const [isSavingRecipe, setIsSavingRecipe] = useState(false)
  const [deletingDishId, setDeletingDishId] = useState(null)
  const [deletingRecipeId, setDeletingRecipeId] = useState(null)

  const resetDishForm = useCallback(() => {
    setDishForm(EMPTY_DISH_FORM)
    setEditingDishId(null)
  }, [])

  const resetRecipeForm = useCallback(() => {
    setRecipeForm(EMPTY_RECIPE_FORM)
    setEditingRecipeId(null)
  }, [])

  const loadRecipesForDish = useCallback(async (dishId) => {
    if (!selectedVenue || !dishId) {
      setRecipeItems([])
      return
    }

    setIsLoadingRecipes(true)

    try {
      const recipesResponse = await partnerApi.getVenueDishRecipes(selectedVenue.id, dishId)
      setRecipeItems(recipesResponse)
    } catch (requestError) {
      setRecipeItems([])
      onError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac receptury potrawy.')
    } finally {
      setIsLoadingRecipes(false)
    }
  }, [onError, selectedVenue])

  const loadDishData = useCallback(async ({ silent = false } = {}) => {
    if (!selectedVenue) {
      return
    }

    if (!silent) {
      setStatus('loading')
    }

    try {
      const [dishesResponse, ingredientsResponse] = await Promise.all([
        partnerApi.getVenueMenuDishes(selectedVenue.id),
        partnerApi.getMenuIngredients(),
      ])

      const nextSelectedDishId = selectedDishId && dishesResponse.some((dish) => dish.id === selectedDishId)
        ? selectedDishId
        : dishesResponse[0]?.id ?? null

      setDishes(dishesResponse)
      setIngredientCatalog(ingredientsResponse)
      setSelectedDishId(nextSelectedDishId)
      setStatus('ready')

      if (nextSelectedDishId) {
        await loadRecipesForDish(nextSelectedDishId)
      } else {
        setRecipeItems([])
      }
    } catch (requestError) {
      onError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac potraw obiektu.')
      setStatus('error')
    }
  }, [loadRecipesForDish, onError, selectedDishId, selectedVenue])

  useEffect(() => {
    if (!selectedVenue) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadDishData()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadDishData, selectedVenue])

  const selectedDish = useMemo(
    () => dishes.find((dish) => dish.id === selectedDishId) ?? null,
    [dishes, selectedDishId],
  )

  const availableRecipeIngredients = useMemo(() => {
    if (editingRecipeId != null) {
      return ingredientCatalog
    }

    const usedIngredientIds = new Set(recipeItems.map((item) => item.ingredientId))
    return ingredientCatalog.filter((ingredient) => !usedIngredientIds.has(ingredient.id))
  }, [editingRecipeId, ingredientCatalog, recipeItems])

  async function handleDishSubmit(event) {
    event.preventDefault()

    if (!selectedVenue) {
      return
    }

    setIsSavingDish(true)
    try {
      const payload = {
        name: dishForm.name.trim(),
        category: dishForm.category,
      }

      let savedDishId = editingDishId
      if (editingDishId == null) {
        const createdDish = await partnerApi.createVenueDish(selectedVenue.id, payload)
        savedDishId = createdDish.id
        onNotice('Potrawa zostala dodana do katalogu obiektu.')
      } else {
        await partnerApi.updateVenueDish(selectedVenue.id, editingDishId, payload)
        onNotice('Zmiany w potrawie zostaly zapisane.')
      }

      resetDishForm()
      await loadDishData({ silent: true })
      if (savedDishId != null) {
        setSelectedDishId(savedDishId)
      }
    } catch (requestError) {
      onError(requestError.response?.data?.message ?? 'Nie udalo sie zapisac potrawy.')
    } finally {
      setIsSavingDish(false)
    }
  }

  function handleStartDishEdit(dish) {
    setEditingDishId(dish.id)
    setDishForm({
      name: dish.name,
      category: dish.category,
    })
  }

  async function handleDeleteDish(dishId) {
    if (!selectedVenue) {
      return
    }

    setDeletingDishId(dishId)
    try {
      await partnerApi.deleteVenueDish(selectedVenue.id, dishId)

      if (editingDishId === dishId) {
        resetDishForm()
      }
      if (selectedDishId === dishId) {
        setSelectedDishId(null)
        resetRecipeForm()
      }

      onNotice('Potrawa zostala usunieta z katalogu obiektu.')
      await loadDishData({ silent: true })
    } catch (requestError) {
      onError(requestError.response?.data?.message ?? 'Nie udalo sie usunac potrawy.')
    } finally {
      setDeletingDishId(null)
    }
  }

  function handleSelectDish(dishId) {
    setSelectedDishId(dishId)
    resetRecipeForm()
    void loadRecipesForDish(dishId)
  }

  function handleStartRecipeEdit(recipe) {
    setEditingRecipeId(recipe.id)
    setRecipeForm({
      ingredientId: String(recipe.ingredientId),
      quantityPerGuest: String(recipe.quantityPerGuest),
    })
  }

  async function handleRecipeSubmit(event) {
    event.preventDefault()

    if (!selectedVenue || !selectedDish) {
      return
    }

    setIsSavingRecipe(true)
    try {
      const payload = {
        ingredientId: Number(recipeForm.ingredientId),
        quantityPerGuest: Number(recipeForm.quantityPerGuest),
      }

      if (editingRecipeId == null) {
        await partnerApi.createVenueDishRecipe(selectedVenue.id, selectedDish.id, payload)
        onNotice('Skladnik zostal dodany do potrawy.')
      } else {
        await partnerApi.updateVenueDishRecipe(selectedVenue.id, selectedDish.id, editingRecipeId, payload)
        onNotice('Receptura potrawy zostala zaktualizowana.')
      }

      resetRecipeForm()
      await loadRecipesForDish(selectedDish.id)
    } catch (requestError) {
      onError(requestError.response?.data?.message ?? 'Nie udalo sie zapisac receptury potrawy.')
    } finally {
      setIsSavingRecipe(false)
    }
  }

  async function handleDeleteRecipe(recipeId) {
    if (!selectedVenue || !selectedDish) {
      return
    }

    setDeletingRecipeId(recipeId)
    try {
      await partnerApi.deleteVenueDishRecipe(selectedVenue.id, selectedDish.id, recipeId)
      if (editingRecipeId === recipeId) {
        resetRecipeForm()
      }
      onNotice('Skladnik zostal usuniety z receptury.')
      await loadRecipesForDish(selectedDish.id)
    } catch (requestError) {
      onError(requestError.response?.data?.message ?? 'Nie udalo sie usunac skladnika z receptury.')
    } finally {
      setDeletingRecipeId(null)
    }
  }

  if (!selectedVenue) {
    return (
      <section className="partner-dashboard__workspace">
        <div className="partner-dashboard__placeholder-panel">
          <strong>Brak wybranego obiektu</strong>
          <span>Wybierz obiekt, aby zarzadzac potrawami i skladnikami.</span>
        </div>
      </section>
    )
  }

  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Potrawy obiektu</span>
          <h2>Katalog potraw i skladniki</h2>
          <p>W tym widoku tworzysz potrawy dla obiektu i definiujesz ich receptury.</p>
        </div>
      </div>

      {status === 'loading' ? (
        <p className="partner-dashboard__empty">Ladowanie potraw obiektu...</p>
      ) : (
        <div className="partner-dashboard__menu-layout">
          <div className="partner-dashboard__menu-list">
            <section className="partner-dashboard__menu-form">
              <div className="partner-dashboard__workspace-header">
                <div>
                  <span className="partner-dashboard__workspace-eyebrow">Potrawa</span>
                  <h3>{editingDishId == null ? 'Dodaj nowa potrawe' : 'Edytuj potrawe'}</h3>
                </div>
                <button type="button" className="partner-dashboard__secondary-action" onClick={resetDishForm}>
                  {editingDishId == null ? 'Wyczysc' : 'Anuluj'}
                </button>
              </div>

              <form className="partner-dashboard__form" onSubmit={handleDishSubmit}>
                <label className="partner-dashboard__field">
                  <span>Nazwa potrawy</span>
                  <input
                    type="text"
                    value={dishForm.name}
                    onChange={(event) => setDishForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="np. Krem z pomidorow"
                    required
                  />
                </label>

                <label className="partner-dashboard__field">
                  <span>Kategoria</span>
                  <select
                    className="partner-dashboard__select"
                    value={dishForm.category}
                    onChange={(event) => setDishForm((current) => ({ ...current, category: event.target.value }))}
                  >
                    <option value="PRZYSTAWKA">Przystawka</option>
                    <option value="ZUPA">Zupa</option>
                    <option value="DANIE_GLOWNE">Danie glowne</option>
                    <option value="DESER">Deser</option>
                    <option value="KOLACJA">Kolacja</option>
                  </select>
                </label>

                <div className="partner-dashboard__edit-actions">
                  <button type="submit" className="partner-dashboard__submit" disabled={isSavingDish}>
                    {isSavingDish ? 'Zapisywanie...' : editingDishId == null ? 'Dodaj potrawe' : 'Zapisz potrawe'}
                  </button>
                </div>
              </form>
            </section>

            <section className="partner-dashboard__menu-assignment">
              <div className="partner-dashboard__menu-assignment-header">
                <div>
                  <h3>Potrawy obiektu</h3>
                  <p>Wybierz potrawe, aby przejsc do skladnikow i receptury.</p>
                </div>
              </div>

              <div className="partner-dashboard__menu-dishes">
                {dishes.length === 0 ? (
                  <p className="partner-dashboard__empty">Brak potraw w katalogu tego obiektu.</p>
                ) : (
                  dishes.map((dish) => {
                    const isDeleting = deletingDishId === dish.id
                    const isEditing = editingDishId === dish.id
                    const isSelected = selectedDishId === dish.id

                    return (
                      <article
                        key={dish.id}
                        className={`partner-dashboard__menu-dish-card${isSelected ? ' partner-dashboard__menu-dish-card--active' : ''}`}
                      >
                        <div>
                          <h4>{dish.name}</h4>
                          <p>{DISH_CATEGORY_LABELS[dish.category] ?? dish.category}</p>
                        </div>
                        <div className="partner-dashboard__edit-actions">
                          <button
                            type="button"
                            className="partner-dashboard__secondary-action"
                            onClick={() => handleSelectDish(dish.id)}
                            disabled={isDeleting}
                          >
                            {isSelected ? 'Wybrana' : 'Skladniki'}
                          </button>
                          <button
                            type="button"
                            className="partner-dashboard__secondary-action"
                            onClick={() => handleStartDishEdit(dish)}
                            disabled={isDeleting}
                          >
                            {isEditing ? 'Edytujesz' : 'Edytuj'}
                          </button>
                          <button
                            type="button"
                            className="partner-dashboard__secondary-action partner-dashboard__secondary-action--danger"
                            onClick={() => void handleDeleteDish(dish.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Usuwanie...' : 'Usun'}
                          </button>
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </section>
          </div>

          <div className="partner-dashboard__menu-detail">
            {selectedDish ? (
              <>
                <div className="partner-dashboard__menu-detail-header">
                  <div>
                    <span className="partner-dashboard__workspace-eyebrow">Receptura</span>
                    <h3>{selectedDish.name}</h3>
                    <p>Dodajesz globalne skladniki i ilosc netto na jednego goscia.</p>
                  </div>
                  <button type="button" className="partner-dashboard__secondary-action" onClick={resetRecipeForm}>
                    {editingRecipeId == null ? 'Wyczysc' : 'Anuluj'}
                  </button>
                </div>

                <div className="partner-dashboard__recipe-list">
                  {isLoadingRecipes ? (
                    <p className="partner-dashboard__empty">Ladowanie receptury...</p>
                  ) : recipeItems.length === 0 ? (
                    <p className="partner-dashboard__empty">Ta potrawa nie ma jeszcze skladnikow.</p>
                  ) : (
                    recipeItems.map((recipe) => {
                      const isDeleting = deletingRecipeId === recipe.id
                      const isEditing = editingRecipeId === recipe.id

                      return (
                        <article key={recipe.id} className="partner-dashboard__recipe-card">
                          <div>
                            <h4>{recipe.ingredientName}</h4>
                            <p>{recipe.quantityPerGuest} {UNIT_LABELS[recipe.unit] ?? recipe.unit} / osoba</p>
                          </div>
                          <div className="partner-dashboard__edit-actions">
                            <button
                              type="button"
                              className="partner-dashboard__secondary-action"
                              onClick={() => handleStartRecipeEdit(recipe)}
                              disabled={isDeleting}
                            >
                              {isEditing ? 'Edytujesz' : 'Edytuj'}
                            </button>
                            <button
                              type="button"
                              className="partner-dashboard__secondary-action partner-dashboard__secondary-action--danger"
                              onClick={() => void handleDeleteRecipe(recipe.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Usuwanie...' : 'Usun skladnik'}
                            </button>
                          </div>
                        </article>
                      )
                    })
                  )}
                </div>

                <section className="partner-dashboard__menu-form">
                  <form className="partner-dashboard__form" onSubmit={handleRecipeSubmit}>
                    <label className="partner-dashboard__field">
                      <span>Skladnik</span>
                      <select
                        className="partner-dashboard__select"
                        value={recipeForm.ingredientId}
                        onChange={(event) => setRecipeForm((current) => ({ ...current, ingredientId: event.target.value }))}
                        required
                      >
                        <option value="">Wybierz skladnik</option>
                        {availableRecipeIngredients.map((ingredient) => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} ({UNIT_LABELS[ingredient.defaultUnit] ?? ingredient.defaultUnit})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="partner-dashboard__field">
                      <span>Ilosc netto na 1 osobe</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={recipeForm.quantityPerGuest}
                        onChange={(event) => setRecipeForm((current) => ({ ...current, quantityPerGuest: event.target.value }))}
                        placeholder="np. 120"
                        required
                      />
                    </label>

                    <div className="partner-dashboard__edit-actions">
                      <button
                        type="submit"
                        className="partner-dashboard__submit"
                        disabled={isSavingRecipe || availableRecipeIngredients.length === 0}
                      >
                        {isSavingRecipe
                          ? 'Zapisywanie...'
                          : editingRecipeId == null
                            ? 'Dodaj skladnik'
                            : 'Zapisz recepture'}
                      </button>
                    </div>
                  </form>
                </section>
              </>
            ) : (
              <div className="partner-dashboard__placeholder-panel">
                <strong>Wybierz potrawe</strong>
                <span>Po lewej stronie wybierz potrawe, aby przejsc do skladnikow i receptury.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default VenueDishesView
