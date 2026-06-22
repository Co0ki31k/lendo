import { useCallback, useEffect, useMemo, useState } from 'react'
import { partnerApi } from '../../../api'

const MENU_TYPE_LABELS = {
  STANDARD: 'Standard',
  VEGETARIAN: 'Vegetarian',
  VEGAN: 'Vegan',
  GLUTEN_FREE: 'Gluten free',
}

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

function VenueMenusView({ selectedVenue, onNotice, onError }) {
  const [menus, setMenus] = useState([])
  const [venueDishes, setVenueDishes] = useState([])
  const [ingredientCatalog, setIngredientCatalog] = useState([])
  const [recipeItems, setRecipeItems] = useState([])
  const [selectedMenuId, setSelectedMenuId] = useState(null)
  const [selectedDishIds, setSelectedDishIds] = useState([])
  const [selectedRecipeDishId, setSelectedRecipeDishId] = useState(null)
  const [dishForm, setDishForm] = useState(EMPTY_DISH_FORM)
  const [recipeForm, setRecipeForm] = useState(EMPTY_RECIPE_FORM)
  const [editingDishId, setEditingDishId] = useState(null)
  const [editingRecipeId, setEditingRecipeId] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [isSavingDefaults, setIsSavingDefaults] = useState(false)
  const [isSavingAssignments, setIsSavingAssignments] = useState(false)
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

  const loadRecipesForDish = useCallback(async (weddingMenuId, dishId) => {
    if (!weddingMenuId || !dishId) {
      setRecipeItems([])
      return
    }

    setIsLoadingRecipes(true)

    try {
      const recipesResponse = await partnerApi.getDishRecipes(weddingMenuId, dishId)
      setRecipeItems(recipesResponse)
    } catch (requestError) {
      setRecipeItems([])
      onError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac receptury potrawy.')
    } finally {
      setIsLoadingRecipes(false)
    }
  }, [onError])

  const loadMenuData = useCallback(async ({ silent = false } = {}) => {
    if (!selectedVenue) {
      return
    }

    if (!silent) {
      setStatus('loading')
    }

    try {
      const [menusResponse, dishesResponse, ingredientsResponse] = await Promise.all([
        partnerApi.getWeddingMenus({ venueId: selectedVenue.id }),
        partnerApi.getVenueMenuDishes(selectedVenue.id),
        partnerApi.getMenuIngredients(),
      ])

      const nextSelectedMenuId = (
        selectedMenuId && menusResponse.some((menu) => menu.id === selectedMenuId)
          ? selectedMenuId
          : menusResponse[0]?.id ?? null
      )
      const nextSelectedMenu = menusResponse.find((menu) => menu.id === nextSelectedMenuId) ?? null
      const nextSelectedRecipeDishId = (
        selectedRecipeDishId && nextSelectedMenu?.dishes.some((dish) => dish.id === selectedRecipeDishId)
          ? selectedRecipeDishId
          : nextSelectedMenu?.dishes[0]?.id ?? null
      )

      setMenus(menusResponse)
      setVenueDishes(dishesResponse)
      setIngredientCatalog(ingredientsResponse)
      setSelectedMenuId(nextSelectedMenuId)
      setSelectedDishIds(nextSelectedMenu?.dishes.map((dish) => dish.id) ?? [])
      setSelectedRecipeDishId(nextSelectedRecipeDishId)
      setStatus('ready')

      if (nextSelectedMenuId && nextSelectedRecipeDishId) {
        await loadRecipesForDish(nextSelectedMenuId, nextSelectedRecipeDishId)
      } else {
        setRecipeItems([])
      }
    } catch (requestError) {
      onError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac menu obiektu.')
      setStatus('error')
    }
  }, [loadRecipesForDish, onError, selectedMenuId, selectedRecipeDishId, selectedVenue])

  useEffect(() => {
    if (!selectedVenue) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadMenuData()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadMenuData, selectedVenue])

  const selectedMenu = useMemo(
    () => menus.find((menu) => menu.id === selectedMenuId) ?? null,
    [menus, selectedMenuId],
  )

  const selectedMenuDishes = useMemo(() => {
    if (!selectedMenu) {
      return []
    }

    return [...selectedMenu.dishes].sort((left, right) => left.name.localeCompare(right.name, 'pl'))
  }, [selectedMenu])

  const selectedRecipeDish = useMemo(
    () => selectedMenuDishes.find((dish) => dish.id === selectedRecipeDishId) ?? null,
    [selectedMenuDishes, selectedRecipeDishId],
  )

  const availableRecipeIngredients = useMemo(() => {
    if (editingRecipeId != null) {
      return ingredientCatalog
    }

    const usedIngredientIds = new Set(recipeItems.map((item) => item.ingredientId))
    return ingredientCatalog.filter((ingredient) => !usedIngredientIds.has(ingredient.id))
  }, [editingRecipeId, ingredientCatalog, recipeItems])

  async function handleEnsureDefaultMenus() {
    if (!selectedVenue) {
      return
    }

    setIsSavingDefaults(true)
    try {
      await partnerApi.ensureDefaultWeddingMenus(selectedVenue.id)
      onNotice('Domyslne menu obiektu zostaly przygotowane.')
      await loadMenuData({ silent: true })
    } catch (requestError) {
      onError(requestError.response?.data?.message ?? 'Nie udalo sie utworzyc domyslnych menu.')
    } finally {
      setIsSavingDefaults(false)
    }
  }

  async function handleDishSubmit(event) {
    event.preventDefault()

    if (!selectedMenu) {
      return
    }

    setIsSavingDish(true)
    try {
      const payload = {
        name: dishForm.name.trim(),
        category: dishForm.category,
      }

      if (editingDishId == null) {
        await partnerApi.createMenuDish(selectedMenu.id, payload)
        onNotice('Potrawa zostala dodana do menu.')
      } else {
        await partnerApi.updateMenuDish(selectedMenu.id, editingDishId, payload)
        onNotice('Zmiany w potrawie zostaly zapisane.')
      }

      resetDishForm()
      await loadMenuData({ silent: true })
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
    setSelectedRecipeDishId(dish.id)
    resetRecipeForm()
    if (selectedMenu) {
      void loadRecipesForDish(selectedMenu.id, dish.id)
    }
  }

  async function handleDeleteDish(dishId) {
    if (!selectedMenu) {
      return
    }

    setDeletingDishId(dishId)
    try {
      await partnerApi.deleteMenuDish(selectedMenu.id, dishId)
      if (editingDishId === dishId) {
        resetDishForm()
      }
      if (selectedRecipeDishId === dishId) {
        setSelectedRecipeDishId(null)
        resetRecipeForm()
      }
      onNotice('Potrawa zostala usunieta z menu.')
      await loadMenuData({ silent: true })
    } catch (requestError) {
      onError(requestError.response?.data?.message ?? 'Nie udalo sie usunac potrawy.')
    } finally {
      setDeletingDishId(null)
    }
  }

  function handleDishSelectionToggle(dishId) {
    setSelectedDishIds((currentDishIds) => (
      currentDishIds.includes(dishId)
        ? currentDishIds.filter((currentDishId) => currentDishId !== dishId)
        : [...currentDishIds, dishId]
    ))
  }

  async function handleSaveAssignments() {
    if (!selectedMenu) {
      return
    }

    setIsSavingAssignments(true)
    try {
      const updatedMenu = await partnerApi.updateWeddingMenu(selectedMenu.id, { dishIds: selectedDishIds })
      setMenus((currentMenus) => currentMenus.map((menu) => (menu.id === updatedMenu.id ? updatedMenu : menu)))

      const nextRecipeDishId = updatedMenu.dishes.some((dish) => dish.id === selectedRecipeDishId)
        ? selectedRecipeDishId
        : updatedMenu.dishes[0]?.id ?? null

      setSelectedRecipeDishId(nextRecipeDishId)
      resetRecipeForm()

      if (nextRecipeDishId) {
        await loadRecipesForDish(updatedMenu.id, nextRecipeDishId)
      } else {
        setRecipeItems([])
      }

      onNotice('Sklad menu zostal zaktualizowany.')
    } catch (requestError) {
      onError(requestError.response?.data?.message ?? 'Nie udalo sie zaktualizowac skladu menu.')
    } finally {
      setIsSavingAssignments(false)
    }
  }

  function handleSelectDishForRecipes(dishId) {
    if (!selectedMenu) {
      return
    }

    setSelectedRecipeDishId(dishId)
    resetRecipeForm()
    void loadRecipesForDish(selectedMenu.id, dishId)
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

    if (!selectedMenu || !selectedRecipeDish) {
      return
    }

    setIsSavingRecipe(true)
    try {
      const payload = {
        ingredientId: Number(recipeForm.ingredientId),
        quantityPerGuest: Number(recipeForm.quantityPerGuest),
      }

      if (editingRecipeId == null) {
        await partnerApi.createDishRecipe(selectedMenu.id, selectedRecipeDish.id, payload)
        onNotice('Skladnik zostal dodany do potrawy.')
      } else {
        await partnerApi.updateDishRecipe(selectedMenu.id, selectedRecipeDish.id, editingRecipeId, payload)
        onNotice('Receptura potrawy zostala zaktualizowana.')
      }

      resetRecipeForm()
      await loadRecipesForDish(selectedMenu.id, selectedRecipeDish.id)
    } catch (requestError) {
      onError(requestError.response?.data?.message ?? 'Nie udalo sie zapisac receptury potrawy.')
    } finally {
      setIsSavingRecipe(false)
    }
  }

  async function handleDeleteRecipe(recipeId) {
    if (!selectedMenu || !selectedRecipeDish) {
      return
    }

    setDeletingRecipeId(recipeId)
    try {
      await partnerApi.deleteDishRecipe(selectedMenu.id, selectedRecipeDish.id, recipeId)
      if (editingRecipeId === recipeId) {
        resetRecipeForm()
      }
      onNotice('Skladnik zostal usuniety z receptury.')
      await loadRecipesForDish(selectedMenu.id, selectedRecipeDish.id)
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
          <span>Wybierz obiekt, aby przygotowac szablony menu i potrawy.</span>
        </div>
      </section>
    )
  }

  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Menu obiektu</span>
          <h2>Szablony menu, potrawy i receptury</h2>
          <p>Tworzysz stale menu dla wybranego obiektu, przypisujesz potrawy i ustawiasz ich skladniki.</p>
        </div>
        <button
          type="button"
          className="partner-dashboard__submit"
          onClick={handleEnsureDefaultMenus}
          disabled={isSavingDefaults}
        >
          {isSavingDefaults ? 'Przygotowywanie...' : 'Utworz 4 domyslne menu'}
        </button>
      </div>

      {status === 'loading' ? (
        <p className="partner-dashboard__empty">Ladowanie menu obiektu...</p>
      ) : menus.length === 0 ? (
        <div className="partner-dashboard__placeholder-panel">
          <strong>Brak menu dla tego obiektu</strong>
          <span>Utworz 4 domyslne szablony, aby przejsc do dodawania i przypisywania potraw.</span>
        </div>
      ) : (
        <div className="partner-dashboard__menu-layout">
          <div className="partner-dashboard__menu-list">
            {menus.map((menu) => (
              <button
                key={menu.id}
                type="button"
                className={`partner-dashboard__menu-card${menu.id === selectedMenuId ? ' partner-dashboard__menu-card--active' : ''}`}
                onClick={() => {
                  setSelectedMenuId(menu.id)
                  setSelectedDishIds(menu.dishes.map((dish) => dish.id))
                  setSelectedRecipeDishId(menu.dishes[0]?.id ?? null)
                  resetDishForm()
                  resetRecipeForm()
                  if (menu.dishes[0]?.id) {
                    void loadRecipesForDish(menu.id, menu.dishes[0].id)
                  } else {
                    setRecipeItems([])
                  }
                }}
              >
                <strong>{MENU_TYPE_LABELS[menu.menuType] ?? menu.menuType}</strong>
                <span>{menu.dishes.length} potraw</span>
              </button>
            ))}

            {selectedMenu ? (
              <section className="partner-dashboard__menu-assignment">
                <div className="partner-dashboard__menu-assignment-header">
                  <div>
                    <h3>Potrawy obiektu</h3>
                    <p>Wybierz, ktore potrawy maja nalezec do menu {MENU_TYPE_LABELS[selectedMenu.menuType] ?? selectedMenu.menuType}.</p>
                  </div>
                  <button
                    type="button"
                    className="partner-dashboard__secondary-action"
                    onClick={handleSaveAssignments}
                    disabled={isSavingAssignments}
                  >
                    {isSavingAssignments ? 'Zapisywanie...' : 'Zapisz sklad menu'}
                  </button>
                </div>

                <div className="partner-dashboard__menu-assignment-list">
                  {venueDishes.length === 0 ? (
                    <p className="partner-dashboard__empty">Brak potraw w tym obiekcie.</p>
                  ) : (
                    venueDishes.map((dish) => (
                      <label key={dish.id} className="partner-dashboard__menu-assignment-item">
                        <input
                          type="checkbox"
                          checked={selectedDishIds.includes(dish.id)}
                          onChange={() => handleDishSelectionToggle(dish.id)}
                        />
                        <span>
                          <strong>{dish.name}</strong>
                          <small>{DISH_CATEGORY_LABELS[dish.category] ?? dish.category}</small>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </div>

          <div className="partner-dashboard__menu-detail">
            {selectedMenu ? (
              <>
                <div className="partner-dashboard__menu-detail-header">
                  <div>
                    <span className="partner-dashboard__workspace-eyebrow">Wybrane menu</span>
                    <h3>{MENU_TYPE_LABELS[selectedMenu.menuType] ?? selectedMenu.menuType}</h3>
                    <p>{selectedMenuDishes.length} potraw przypisanych do tego menu.</p>
                  </div>
                </div>

                <div className="partner-dashboard__menu-dishes">
                  {selectedMenuDishes.length === 0 ? (
                    <p className="partner-dashboard__empty">To menu nie ma jeszcze przypisanych potraw.</p>
                  ) : (
                    selectedMenuDishes.map((dish) => {
                      const isDeleting = deletingDishId === dish.id
                      const isEditing = editingDishId === dish.id
                      const isRecipeSelected = selectedRecipeDishId === dish.id

                      return (
                        <article
                          key={dish.id}
                          className={`partner-dashboard__menu-dish-card${isRecipeSelected ? ' partner-dashboard__menu-dish-card--active' : ''}`}
                        >
                          <div>
                            <h4>{dish.name}</h4>
                            <p>{DISH_CATEGORY_LABELS[dish.category] ?? dish.category}</p>
                          </div>
                          <div className="partner-dashboard__edit-actions">
                            <button
                              type="button"
                              className="partner-dashboard__secondary-action"
                              onClick={() => handleSelectDishForRecipes(dish.id)}
                              disabled={isDeleting}
                            >
                              {isRecipeSelected ? 'Wybrana do receptury' : 'Skladniki'}
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
                              {isDeleting ? 'Usuwanie...' : 'Usun z menu'}
                            </button>
                          </div>
                        </article>
                      )
                    })
                  )}
                </div>

                <form className="partner-dashboard__menu-form" onSubmit={handleDishSubmit}>
                  <div className="partner-dashboard__workspace-header">
                    <div>
                      <span className="partner-dashboard__workspace-eyebrow">Potrawa</span>
                      <h3>{editingDishId == null ? 'Dodaj nowa potrawe' : 'Edytuj potrawe'}</h3>
                    </div>
                    <button type="button" className="partner-dashboard__secondary-action" onClick={resetDishForm}>
                      {editingDishId == null ? 'Wyczysc' : 'Anuluj'}
                    </button>
                  </div>

                  <div className="partner-dashboard__form">
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
                  </div>

                  <div className="partner-dashboard__edit-actions">
                    <button type="submit" className="partner-dashboard__submit" disabled={isSavingDish}>
                      {isSavingDish ? 'Zapisywanie...' : editingDishId == null ? 'Dodaj potrawe do menu' : 'Zapisz potrawe'}
                    </button>
                  </div>
                </form>

                <section className="partner-dashboard__menu-form">
                  <div className="partner-dashboard__workspace-header">
                    <div>
                      <span className="partner-dashboard__workspace-eyebrow">Receptura</span>
                      <h3>{selectedRecipeDish ? `Skladniki: ${selectedRecipeDish.name}` : 'Wybierz potrawe'}</h3>
                      <p>
                        {selectedRecipeDish
                          ? 'Dodajesz globalne skladniki i ilosc netto na jednego goscia.'
                          : 'Najpierw wybierz potrawe z listy powyzej.'}
                      </p>
                    </div>
                    {selectedRecipeDish ? (
                      <button type="button" className="partner-dashboard__secondary-action" onClick={resetRecipeForm}>
                        {editingRecipeId == null ? 'Wyczysc' : 'Anuluj'}
                      </button>
                    ) : null}
                  </div>

                  {selectedRecipeDish ? (
                    <>
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
                                  <p>
                                    {recipe.quantityPerGuest} {UNIT_LABELS[recipe.unit] ?? recipe.unit} / osoba
                                  </p>
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
                    </>
                  ) : (
                    <p className="partner-dashboard__empty">Wybierz potrawe, aby zarzadzac jej skladnikami.</p>
                  )}
                </section>
              </>
            ) : (
              <div className="partner-dashboard__placeholder-panel">
                <strong>Wybierz menu</strong>
                <span>Po lewej stronie wybierz typ menu, z ktorym chcesz pracowac.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default VenueMenusView
