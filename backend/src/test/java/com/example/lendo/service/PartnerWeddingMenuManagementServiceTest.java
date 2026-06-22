package com.example.lendo.service;

import com.example.lendo.dto.DishUpsertRequest;
import com.example.lendo.dto.RecipeUpsertRequest;
import com.example.lendo.dto.UpdateWeddingMenuRequest;
import com.example.lendo.dto.WeddingMenuResponse;
import com.example.lendo.model.Dish;
import com.example.lendo.model.DishCategory;
import com.example.lendo.model.Ingredient;
import com.example.lendo.model.IngredientCategory;
import com.example.lendo.model.MenuType;
import com.example.lendo.model.PartnerProfile;
import com.example.lendo.model.Role;
import com.example.lendo.model.UnitOfMeasure;
import com.example.lendo.model.User;
import com.example.lendo.model.Venue;
import com.example.lendo.model.WeddingMenu;
import com.example.lendo.repository.DishRepository;
import com.example.lendo.repository.IngredientRepository;
import com.example.lendo.repository.PartnerProfileRepository;
import com.example.lendo.repository.RecipeRepository;
import com.example.lendo.repository.VenueRepository;
import com.example.lendo.repository.WeddingMenuRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PartnerWeddingMenuManagementServiceTest {
    @Mock
    private WeddingMenuRepository weddingMenuRepository;
    @Mock
    private VenueRepository venueRepository;
    @Mock
    private DishRepository dishRepository;
    @Mock
    private IngredientRepository ingredientRepository;
    @Mock
    private RecipeRepository recipeRepository;
    @Mock
    private PartnerProfileRepository partnerProfileRepository;

    @InjectMocks
    private PartnerWeddingMenuManagementService partnerWeddingMenuManagementService;

    @Test
    void shouldEnsureDefaultMenusForVenue() {
        User manager = managerUser();
        Venue venue = venue(manager, 15L);

        when(partnerProfileRepository.findById(manager.getId())).thenReturn(Optional.of(verifiedProfile(manager)));
        when(venueRepository.findById(15L)).thenReturn(Optional.of(venue));
        when(weddingMenuRepository.findByVenueIdAndMenuType(15L, MenuType.STANDARD)).thenReturn(Optional.empty());
        when(weddingMenuRepository.findByVenueIdAndMenuType(15L, MenuType.VEGETARIAN)).thenReturn(Optional.empty());
        when(weddingMenuRepository.findByVenueIdAndMenuType(15L, MenuType.VEGAN)).thenReturn(Optional.empty());
        when(weddingMenuRepository.findByVenueIdAndMenuType(15L, MenuType.GLUTEN_FREE)).thenReturn(Optional.empty());

        partnerWeddingMenuManagementService.ensureDefaultMenus(manager, 15L);

        verify(weddingMenuRepository, times(4)).save(any(WeddingMenu.class));
    }

    @Test
    void shouldCreateDishAndAttachToWeddingMenu() {
        User manager = managerUser();
        WeddingMenu weddingMenu = weddingMenu(manager, 20L, MenuType.VEGAN);

        when(partnerProfileRepository.findById(manager.getId())).thenReturn(Optional.of(verifiedProfile(manager)));
        when(weddingMenuRepository.findById(20L)).thenReturn(Optional.of(weddingMenu));
        when(dishRepository.save(any(Dish.class))).thenAnswer(invocation -> {
            Dish dish = invocation.getArgument(0);
            dish.setId(11L);
            return dish;
        });

        var response = partnerWeddingMenuManagementService.createDish(
                manager,
                20L,
                new DishUpsertRequest("Tatar", DishCategory.PRZYSTAWKA)
        );

        assertEquals(11L, response.id());
        assertEquals("Tatar", response.name());
        assertEquals(1, weddingMenu.getDishes().size());
    }

    @Test
    void shouldRejectVenueFromAnotherManager() {
        User owner = managerUser();
        User otherManager = managerUser();
        Venue venue = venue(owner, 15L);

        when(partnerProfileRepository.findById(otherManager.getId())).thenReturn(Optional.of(verifiedProfile(otherManager)));
        when(venueRepository.findById(15L)).thenReturn(Optional.of(venue));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> partnerWeddingMenuManagementService.ensureDefaultMenus(otherManager, 15L)
        );

        assertEquals("Nie masz dostepu do tego obiektu", exception.getMessage());
        verify(weddingMenuRepository, never()).save(any(WeddingMenu.class));
    }

    @Test
    void shouldReplaceMenuDishes() {
        User manager = managerUser();
        WeddingMenu weddingMenu = weddingMenu(manager, 20L, MenuType.GLUTEN_FREE);
        Dish firstDish = dish(weddingMenu.getVenue(), 1L, "Rosol");
        Dish secondDish = dish(weddingMenu.getVenue(), 2L, "Sernik");
        weddingMenu.setDishes(new LinkedHashSet<>(Set.of(firstDish)));
        firstDish.getWeddingMenus().add(weddingMenu);

        when(partnerProfileRepository.findById(manager.getId())).thenReturn(Optional.of(verifiedProfile(manager)));
        when(weddingMenuRepository.findById(20L)).thenReturn(Optional.of(weddingMenu));
        when(dishRepository.findAllByIdInAndVenueId(List.of(2L), weddingMenu.getVenue().getId())).thenReturn(List.of(secondDish));

        WeddingMenuResponse response = partnerWeddingMenuManagementService.updateWeddingMenu(
                manager,
                20L,
                new UpdateWeddingMenuRequest(List.of(2L))
        );

        assertEquals(1, response.dishes().size());
        assertEquals("Sernik", response.dishes().getFirst().name());
    }

    @Test
    void shouldCreateRecipeForDishInManagedVenueMenu() {
        User manager = managerUser();
        WeddingMenu weddingMenu = weddingMenu(manager, 20L, MenuType.STANDARD);
        Dish dish = dish(weddingMenu.getVenue(), 5L, "Rosol");
        dish.getWeddingMenus().add(weddingMenu);
        weddingMenu.getDishes().add(dish);
        Ingredient ingredient = Ingredient.builder()
                .id(8L)
                .name("Marchew")
                .category(IngredientCategory.WARZYWA_OWOCE)
                .defaultUnit(UnitOfMeasure.G)
                .wastePercentage(0.1)
                .build();

        when(partnerProfileRepository.findById(manager.getId())).thenReturn(Optional.of(verifiedProfile(manager)));
        when(weddingMenuRepository.findById(20L)).thenReturn(Optional.of(weddingMenu));
        when(ingredientRepository.findById(8L)).thenReturn(Optional.of(ingredient));
        when(recipeRepository.existsByDishIdAndIngredientId(5L, 8L)).thenReturn(false);
        when(recipeRepository.save(any())).thenAnswer(invocation -> {
            var recipe = (com.example.lendo.model.Recipe) invocation.getArgument(0);
            recipe.setId(50L);
            return recipe;
        });
        when(recipeRepository.findById(50L)).thenAnswer(invocation -> Optional.of(
                com.example.lendo.model.Recipe.builder()
                        .id(50L)
                        .dish(dish)
                        .ingredient(ingredient)
                        .quantityPerGuest(120.0)
                        .build()
        ));

        var response = partnerWeddingMenuManagementService.createRecipe(
                manager,
                20L,
                5L,
                new RecipeUpsertRequest(8L, 120.0)
        );

        assertEquals(50L, response.id());
        assertEquals(8L, response.ingredientId());
    }

    private User managerUser() {
        return User.builder()
                .id(UUID.randomUUID())
                .role(Role.builder().name("MANAGER").build())
                .build();
    }

    private PartnerProfile verifiedProfile(User user) {
        return PartnerProfile.builder()
                .user(user)
                .verified(true)
                .build();
    }

    private Venue venue(User manager, Long id) {
        return Venue.builder()
                .id(id)
                .manager(manager)
                .build();
    }

    private WeddingMenu weddingMenu(User manager, Long id, MenuType menuType) {
        return WeddingMenu.builder()
                .id(id)
                .venue(venue(manager, 15L))
                .menuType(menuType)
                .dishes(new LinkedHashSet<>())
                .build();
    }

    private Dish dish(Venue venue, Long id, String name) {
        return Dish.builder()
                .id(id)
                .name(name)
                .category(DishCategory.ZUPA)
                .venue(venue)
                .weddingMenus(new LinkedHashSet<>())
                .recipes(new LinkedHashSet<>())
                .build();
    }
}
