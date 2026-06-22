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

function VenueMenusView({ selectedVenue, onNotice, onError }) {
  const [menus, setMenus] = useState([])
  const [venueDishes, setVenueDishes] = useState([])
  const [selectedMenuId, setSelectedMenuId] = useState(null)
  const [selectedDishIds, setSelectedDishIds] = useState([])
  const [status, setStatus] = useState('loading')
  const [isSavingDefaults, setIsSavingDefaults] = useState(false)
  const [isSavingAssignments, setIsSavingAssignments] = useState(false)

  const loadMenuData = useCallback(async ({ silent = false } = {}) => {
    if (!selectedVenue) {
      return
    }

    if (!silent) {
      setStatus('loading')
    }

    try {
      const [menusResponse, dishesResponse] = await Promise.all([
        partnerApi.getWeddingMenus({ venueId: selectedVenue.id }),
        partnerApi.getVenueMenuDishes(selectedVenue.id),
      ])

      const nextSelectedMenuId = selectedMenuId && menusResponse.some((menu) => menu.id === selectedMenuId)
        ? selectedMenuId
        : menusResponse[0]?.id ?? null
      const nextSelectedMenu = menusResponse.find((menu) => menu.id === nextSelectedMenuId) ?? null

      setMenus(menusResponse)
      setVenueDishes(dishesResponse)
      setSelectedMenuId(nextSelectedMenuId)
      setSelectedDishIds(nextSelectedMenu?.dishes.map((dish) => dish.id) ?? [])
      setStatus('ready')
    } catch (requestError) {
      onError(requestError.response?.data?.message ?? 'Nie udalo sie pobrac menu obiektu.')
      setStatus('error')
    }
  }, [onError, selectedMenuId, selectedVenue])

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
      onNotice('Sklad menu zostal zaktualizowany.')
    } catch (requestError) {
      onError(requestError.response?.data?.message ?? 'Nie udalo sie zaktualizowac skladu menu.')
    } finally {
      setIsSavingAssignments(false)
    }
  }

  if (!selectedVenue) {
    return (
      <section className="partner-dashboard__workspace">
        <div className="partner-dashboard__placeholder-panel">
          <strong>Brak wybranego obiektu</strong>
          <span>Wybierz obiekt, aby przygotowac szablony menu.</span>
        </div>
      </section>
    )
  }

  return (
    <section className="partner-dashboard__workspace">
      <div className="partner-dashboard__workspace-header">
        <div>
          <span className="partner-dashboard__workspace-eyebrow">Menu obiektu</span>
          <h2>Sklad menu</h2>
          <p>W tym widoku przypisujesz gotowe potrawy obiektu do wybranego szablonu menu.</p>
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
          <span>Utworz 4 domyslne szablony, aby przejsc do przypisywania potraw.</span>
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
                    selectedMenuDishes.map((dish) => (
                      <article key={dish.id} className="partner-dashboard__menu-dish-card">
                        <div>
                          <h4>{dish.name}</h4>
                          <p>{DISH_CATEGORY_LABELS[dish.category] ?? dish.category}</p>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                <div className="partner-dashboard__placeholder-panel">
                  <strong>Kolejny krok</strong>
                  <span>Dodawanie nowych potraw i zarzadzanie skladnikami przenioslem do osobnego ekranu „Potrawy i skladniki”.</span>
                </div>
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
