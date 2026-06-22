package com.example.lendo.service;

import com.example.lendo.dto.DishSummaryResponse;
import com.example.lendo.dto.DishUpsertRequest;
import com.example.lendo.dto.IngredientResponse;
import com.example.lendo.dto.RecipeResponse;
import com.example.lendo.dto.RecipeUpsertRequest;
import com.example.lendo.dto.UpdateWeddingMenuRequest;
import com.example.lendo.dto.WeddingMenuResponse;
import com.example.lendo.model.Dish;
import com.example.lendo.model.Ingredient;
import com.example.lendo.model.MenuType;
import com.example.lendo.model.Recipe;
import com.example.lendo.model.User;
import com.example.lendo.model.Venue;
import com.example.lendo.model.WeddingMenu;
import com.example.lendo.repository.DishRepository;
import com.example.lendo.repository.IngredientRepository;
import com.example.lendo.repository.PartnerProfileRepository;
import com.example.lendo.repository.RecipeRepository;
import com.example.lendo.repository.VenueRepository;
import com.example.lendo.repository.WeddingMenuRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PartnerWeddingMenuManagementService {
    private final WeddingMenuRepository weddingMenuRepository;
    private final VenueRepository venueRepository;
    private final DishRepository dishRepository;
    private final IngredientRepository ingredientRepository;
    private final RecipeRepository recipeRepository;
    private final PartnerProfileRepository partnerProfileRepository;

    @Transactional
    public List<WeddingMenuResponse> getWeddingMenus(User user, Long venueId) {
        requireVerifiedPartnerProfileIfManager(user);

        if (venueId != null) {
            Venue venue = requireManagedVenue(user, venueId);
            return weddingMenuRepository.findAllByVenueIdOrderByMenuTypeAsc(venue.getId()).stream()
                    .map(WeddingMenuResponse::from)
                    .toList();
        }

        if ("ADMIN".equals(user.getRoleName())) {
            return weddingMenuRepository.findAll().stream()
                    .map(WeddingMenuResponse::from)
                    .toList();
        }

        return weddingMenuRepository.findAllByVenueManagerIdOrderByVenueIdAscMenuTypeAsc(user.getId()).stream()
                .map(WeddingMenuResponse::from)
                .toList();
    }

    @Transactional
    public WeddingMenuResponse getWeddingMenu(User user, Long weddingMenuId) {
        return WeddingMenuResponse.from(requireManagedWeddingMenu(user, weddingMenuId));
    }

    @Transactional
    public WeddingMenuResponse updateWeddingMenu(User user, Long weddingMenuId, UpdateWeddingMenuRequest request) {
        WeddingMenu weddingMenu = requireManagedWeddingMenu(user, weddingMenuId);
        Set<Dish> updatedDishes = new LinkedHashSet<>(resolveAccessibleDishes(user, request.dishIds(), weddingMenu.getVenue()));

        replaceMenuDishes(weddingMenu, updatedDishes);
        return WeddingMenuResponse.from(weddingMenu);
    }

    @Transactional
    public DishSummaryResponse createDish(User user, Long weddingMenuId, DishUpsertRequest request) {
        WeddingMenu weddingMenu = requireManagedWeddingMenu(user, weddingMenuId);
        Dish dish = dishRepository.save(
                Dish.builder()
                        .name(normalizeName(request.name()))
                        .category(request.category())
                        .venue(weddingMenu.getVenue())
                        .build()
        );

        addDishToMenu(weddingMenu, dish);
        return DishSummaryResponse.from(dish);
    }

    @Transactional
    public DishSummaryResponse createVenueDish(User user, Long venueId, DishUpsertRequest request) {
        Venue venue = requireManagedVenue(user, venueId);
        Dish dish = dishRepository.save(
                Dish.builder()
                        .name(normalizeName(request.name()))
                        .category(request.category())
                        .venue(venue)
                        .build()
        );

        return DishSummaryResponse.from(dish);
    }

    @Transactional
    public DishSummaryResponse updateDish(User user, Long weddingMenuId, Long dishId, DishUpsertRequest request) {
        WeddingMenu weddingMenu = requireManagedWeddingMenu(user, weddingMenuId);
        Dish dish = requireDishInMenuVenue(weddingMenu, dishId);

        dish.setName(normalizeName(request.name()));
        dish.setCategory(request.category());
        return DishSummaryResponse.from(dish);
    }

    @Transactional
    public DishSummaryResponse updateVenueDish(User user, Long venueId, Long dishId, DishUpsertRequest request) {
        Venue venue = requireManagedVenue(user, venueId);
        Dish dish = requireDishInVenue(venue, dishId);

        dish.setName(normalizeName(request.name()));
        dish.setCategory(request.category());
        return DishSummaryResponse.from(dish);
    }

    @Transactional
    public void deleteDish(User user, Long weddingMenuId, Long dishId) {
        WeddingMenu weddingMenu = requireManagedWeddingMenu(user, weddingMenuId);
        Dish dish = requireDishInMenuVenue(weddingMenu, dishId);

        removeDishFromMenu(weddingMenu, dish);
        if (dish.getWeddingMenus().isEmpty()) {
            dishRepository.delete(dish);
        }
    }

    @Transactional
    public void deleteVenueDish(User user, Long venueId, Long dishId) {
        Venue venue = requireManagedVenue(user, venueId);
        Dish dish = requireDishInVenue(venue, dishId);

        for (WeddingMenu weddingMenu : List.copyOf(dish.getWeddingMenus())) {
            removeDishFromMenu(weddingMenu, dish);
        }

        dishRepository.delete(dish);
    }

    @Transactional
    public List<DishSummaryResponse> getVenueDishes(User user, Long venueId) {
        Venue venue = requireManagedVenue(user, venueId);
        return dishRepository.findAllByVenueIdOrderByNameAsc(venue.getId()).stream()
                .map(DishSummaryResponse::from)
                .toList();
    }

    @Transactional
    public List<IngredientResponse> getAvailableIngredients(User user) {
        requireVerifiedPartnerProfileIfManager(user);
        return ingredientRepository.findAllByOrderByCategoryAscNameAsc().stream()
                .map(IngredientResponse::from)
                .toList();
    }

    @Transactional
    public List<RecipeResponse> getDishRecipes(User user, Long weddingMenuId, Long dishId) {
        WeddingMenu weddingMenu = requireManagedWeddingMenu(user, weddingMenuId);
        Dish dish = requireDishInMenuVenue(weddingMenu, dishId);
        return recipeRepository.findAllDetailedByDishId(dish.getId()).stream()
                .map(RecipeResponse::from)
                .toList();
    }

    @Transactional
    public List<RecipeResponse> getVenueDishRecipes(User user, Long venueId, Long dishId) {
        Venue venue = requireManagedVenue(user, venueId);
        Dish dish = requireDishInVenue(venue, dishId);
        return recipeRepository.findAllDetailedByDishId(dish.getId()).stream()
                .map(RecipeResponse::from)
                .toList();
    }

    @Transactional
    public RecipeResponse createRecipe(User user, Long weddingMenuId, Long dishId, RecipeUpsertRequest request) {
        WeddingMenu weddingMenu = requireManagedWeddingMenu(user, weddingMenuId);
        Dish dish = requireDishInMenuVenue(weddingMenu, dishId);
        Ingredient ingredient = requireIngredient(request.ingredientId());

        if (recipeRepository.existsByDishIdAndIngredientId(dish.getId(), ingredient.getId())) {
            throw new RuntimeException("Ten skladnik jest juz przypisany do potrawy");
        }

        Recipe recipe = recipeRepository.save(
                Recipe.builder()
                        .dish(dish)
                        .ingredient(ingredient)
                        .quantityPerGuest(request.quantityPerGuest())
                        .build()
        );

        return RecipeResponse.from(recipeRepository.findById(recipe.getId())
                .orElseThrow(() -> new RuntimeException("Receptura nie istnieje")));
    }

    @Transactional
    public RecipeResponse createVenueDishRecipe(User user, Long venueId, Long dishId, RecipeUpsertRequest request) {
        Venue venue = requireManagedVenue(user, venueId);
        Dish dish = requireDishInVenue(venue, dishId);
        Ingredient ingredient = requireIngredient(request.ingredientId());

        if (recipeRepository.existsByDishIdAndIngredientId(dish.getId(), ingredient.getId())) {
            throw new RuntimeException("Ten skladnik jest juz przypisany do potrawy");
        }

        Recipe recipe = recipeRepository.save(
                Recipe.builder()
                        .dish(dish)
                        .ingredient(ingredient)
                        .quantityPerGuest(request.quantityPerGuest())
                        .build()
        );

        return RecipeResponse.from(recipeRepository.findById(recipe.getId())
                .orElseThrow(() -> new RuntimeException("Receptura nie istnieje")));
    }

    @Transactional
    public RecipeResponse updateRecipe(User user, Long weddingMenuId, Long dishId, Long recipeId, RecipeUpsertRequest request) {
        WeddingMenu weddingMenu = requireManagedWeddingMenu(user, weddingMenuId);
        Dish dish = requireDishInMenuVenue(weddingMenu, dishId);
        Recipe recipe = recipeRepository.findByIdAndDishId(recipeId, dish.getId())
                .orElseThrow(() -> new RuntimeException("Receptura nie istnieje"));
        Ingredient ingredient = requireIngredient(request.ingredientId());

        if (!Objects.equals(recipe.getIngredient().getId(), ingredient.getId())
                && recipeRepository.existsByDishIdAndIngredientId(dish.getId(), ingredient.getId())) {
            throw new RuntimeException("Ten skladnik jest juz przypisany do potrawy");
        }

        recipe.setIngredient(ingredient);
        recipe.setQuantityPerGuest(request.quantityPerGuest());
        return RecipeResponse.from(recipe);
    }

    @Transactional
    public RecipeResponse updateVenueDishRecipe(User user, Long venueId, Long dishId, Long recipeId, RecipeUpsertRequest request) {
        Venue venue = requireManagedVenue(user, venueId);
        Dish dish = requireDishInVenue(venue, dishId);
        Recipe recipe = recipeRepository.findByIdAndDishId(recipeId, dish.getId())
                .orElseThrow(() -> new RuntimeException("Receptura nie istnieje"));
        Ingredient ingredient = requireIngredient(request.ingredientId());

        if (!Objects.equals(recipe.getIngredient().getId(), ingredient.getId())
                && recipeRepository.existsByDishIdAndIngredientId(dish.getId(), ingredient.getId())) {
            throw new RuntimeException("Ten skladnik jest juz przypisany do potrawy");
        }

        recipe.setIngredient(ingredient);
        recipe.setQuantityPerGuest(request.quantityPerGuest());
        return RecipeResponse.from(recipe);
    }

    @Transactional
    public void deleteRecipe(User user, Long weddingMenuId, Long dishId, Long recipeId) {
        WeddingMenu weddingMenu = requireManagedWeddingMenu(user, weddingMenuId);
        Dish dish = requireDishInMenuVenue(weddingMenu, dishId);
        Recipe recipe = recipeRepository.findByIdAndDishId(recipeId, dish.getId())
                .orElseThrow(() -> new RuntimeException("Receptura nie istnieje"));
        recipeRepository.delete(recipe);
    }

    @Transactional
    public void deleteVenueDishRecipe(User user, Long venueId, Long dishId, Long recipeId) {
        Venue venue = requireManagedVenue(user, venueId);
        Dish dish = requireDishInVenue(venue, dishId);
        Recipe recipe = recipeRepository.findByIdAndDishId(recipeId, dish.getId())
                .orElseThrow(() -> new RuntimeException("Receptura nie istnieje"));
        recipeRepository.delete(recipe);
    }

    @Transactional
    public void ensureDefaultMenus(User user, Long venueId) {
        Venue venue = requireManagedVenue(user, venueId);

        for (MenuType menuType : MenuType.values()) {
            if (weddingMenuRepository.findByVenueIdAndMenuType(venue.getId(), menuType).isEmpty()) {
                weddingMenuRepository.save(WeddingMenu.builder()
                        .venue(venue)
                        .menuType(menuType)
                        .build());
            }
        }
    }

    private Venue requireManagedVenue(User user, Long venueId) {
        requireVerifiedPartnerProfileIfManager(user);

        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new RuntimeException("Obiekt nie istnieje"));

        if (!"ADMIN".equals(user.getRoleName())
                && !Objects.equals(venue.getManager().getId(), user.getId())) {
            throw new RuntimeException("Nie masz dostepu do tego obiektu");
        }

        return venue;
    }

    private Ingredient requireIngredient(Long ingredientId) {
        return ingredientRepository.findById(ingredientId)
                .orElseThrow(() -> new RuntimeException("Skladnik nie istnieje"));
    }

    private void replaceMenuDishes(WeddingMenu weddingMenu, Collection<Dish> updatedDishes) {
        detachAllDishes(weddingMenu);
        for (Dish dish : updatedDishes) {
            addDishToMenu(weddingMenu, dish);
        }
    }

    private void detachAllDishes(WeddingMenu weddingMenu) {
        List<Dish> currentDishes = List.copyOf(weddingMenu.getDishes());
        for (Dish dish : currentDishes) {
            removeDishFromMenu(weddingMenu, dish);
        }
    }

    private void addDishToMenu(WeddingMenu weddingMenu, Dish dish) {
        if (!Objects.equals(dish.getVenue().getId(), weddingMenu.getVenue().getId())) {
            throw new RuntimeException("Potrawa musi byc przypisana do tego samego obiektu co menu");
        }
        weddingMenu.getDishes().add(dish);
        dish.getWeddingMenus().add(weddingMenu);
    }

    private void removeDishFromMenu(WeddingMenu weddingMenu, Dish dish) {
        weddingMenu.getDishes().remove(dish);
        dish.getWeddingMenus().remove(weddingMenu);
    }

    private void synchronizeDishLinks(WeddingMenu weddingMenu) {
        for (Dish dish : weddingMenu.getDishes()) {
            dish.getWeddingMenus().add(weddingMenu);
        }
    }

    private String normalizeName(String name) {
        return name.trim();
    }

    private Dish requireDishInMenuVenue(WeddingMenu weddingMenu, Long dishId) {
        Dish dish = weddingMenu.getDishes().stream()
                .filter(item -> Objects.equals(item.getId(), dishId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Potrawa nie jest przypisana do tego menu"));

        if (!Objects.equals(dish.getVenue().getId(), weddingMenu.getVenue().getId())) {
            throw new RuntimeException("Nie masz dostepu do tej potrawy");
        }

        return dish;
    }

    private Dish requireDishInVenue(Venue venue, Long dishId) {
        return dishRepository.findByIdAndVenueId(dishId, venue.getId())
                .orElseThrow(() -> new RuntimeException("Potrawa nie istnieje albo nie jest przypisana do obiektu"));
    }

    private WeddingMenu requireManagedWeddingMenu(User user, Long weddingMenuId) {
        requireVerifiedPartnerProfileIfManager(user);

        WeddingMenu weddingMenu = weddingMenuRepository.findById(weddingMenuId)
                .orElseThrow(() -> new RuntimeException("Menu weselne nie istnieje"));

        if (!"ADMIN".equals(user.getRoleName())
                && !Objects.equals(weddingMenu.getVenue().getManager().getId(), user.getId())) {
            throw new RuntimeException("Nie masz dostepu do tego menu weselnego");
        }

        return weddingMenu;
    }

    private List<Dish> resolveAccessibleDishes(User user, List<Long> dishIds, Venue venue) {
        if (dishIds == null || dishIds.isEmpty()) {
            return List.of();
        }

        List<Dish> dishes = "ADMIN".equals(user.getRoleName())
                ? dishRepository.findAllByIdIn(dishIds)
                : dishRepository.findAllByIdInAndVenueId(dishIds, venue.getId());

        if (dishes.size() != Set.copyOf(dishIds).size()) {
            throw new RuntimeException("Co najmniej jedna potrawa nie istnieje albo nie jest przypisana do obiektu");
        }

        if (dishes.stream().anyMatch(dish -> !Objects.equals(dish.getVenue().getId(), venue.getId()))) {
            throw new RuntimeException("Do menu mozna przypisac tylko potrawy przypisane do obiektu");
        }

        return dishes;
    }

    private void requireVerifiedPartnerProfileIfManager(User user) {
        if ("ADMIN".equals(user.getRoleName())) {
            return;
        }

        var profile = partnerProfileRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Najpierw uzupelnij profil partnera"));

        if (!profile.isVerified()) {
            throw new RuntimeException("Profil partnera czeka na zatwierdzenie przez administratora");
        }
    }
}
