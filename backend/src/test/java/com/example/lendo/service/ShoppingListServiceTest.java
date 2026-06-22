package com.example.lendo.service;

import com.example.lendo.dto.ShoppingItemDTO;
import com.example.lendo.model.Booking;
import com.example.lendo.model.GuestDietLogistics;
import com.example.lendo.model.IngredientCategory;
import com.example.lendo.model.MenuType;
import com.example.lendo.model.Role;
import com.example.lendo.model.UnitOfMeasure;
import com.example.lendo.model.User;
import com.example.lendo.model.Venue;
import com.example.lendo.model.WeddingMenu;
import com.example.lendo.repository.BookingRepository;
import com.example.lendo.repository.GuestDietLogisticsRepository;
import com.example.lendo.repository.RecipeRepository;
import com.example.lendo.repository.WeddingMenuRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShoppingListServiceTest {
    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private GuestDietLogisticsRepository guestDietLogisticsRepository;

    @Mock
    private WeddingMenuRepository weddingMenuRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @InjectMocks
    private ShoppingListService shoppingListService;

    @Test
    void shouldAggregateShoppingListAcrossBookingMenus() {
        User manager = managerUser();
        Venue venue = venue(manager);
        Booking booking = booking(44L, venue);
        GuestDietLogistics logistics = logistics(44L, booking, 10, 5, 0, 0);
        WeddingMenu standardMenu = weddingMenu(11L, venue, MenuType.STANDARD);
        WeddingMenu vegetarianMenu = weddingMenu(12L, venue, MenuType.VEGETARIAN);

        when(bookingRepository.findById(44L)).thenReturn(Optional.of(booking));
        when(guestDietLogisticsRepository.findById(44L)).thenReturn(Optional.of(logistics));
        when(weddingMenuRepository.findByVenueIdAndMenuType(venue.getId(), MenuType.STANDARD)).thenReturn(Optional.of(standardMenu));
        when(weddingMenuRepository.findByVenueIdAndMenuType(venue.getId(), MenuType.VEGETARIAN)).thenReturn(Optional.of(vegetarianMenu));
        when(recipeRepository.calculateShoppingItems(11L, 10)).thenReturn(List.of(
                new ShoppingItemDTO("Kurczak", IngredientCategory.MIESO, 12_000.0, UnitOfMeasure.G),
                new ShoppingItemDTO("Marchew", IngredientCategory.WARZYWA_OWOCE, 8_000.0, UnitOfMeasure.G)
        ));
        when(recipeRepository.calculateShoppingItems(12L, 5)).thenReturn(List.of(
                new ShoppingItemDTO("Marchew", IngredientCategory.WARZYWA_OWOCE, 7_500.0, UnitOfMeasure.G),
                new ShoppingItemDTO("Smietana", IngredientCategory.NABIAL, 2_500.0, UnitOfMeasure.ML)
        ));

        List<ShoppingItemDTO> result = shoppingListService.generateShoppingList(manager, 44L);

        assertEquals(List.of(
                new ShoppingItemDTO("Kurczak", IngredientCategory.MIESO, 12_000.0, UnitOfMeasure.G),
                new ShoppingItemDTO("Smietana", IngredientCategory.NABIAL, 2_500.0, UnitOfMeasure.ML),
                new ShoppingItemDTO("Marchew", IngredientCategory.WARZYWA_OWOCE, 15_500.0, UnitOfMeasure.G)
        ), result);
        verify(recipeRepository).calculateShoppingItems(11L, 10);
        verify(recipeRepository).calculateShoppingItems(12L, 5);
    }

    @Test
    void shouldGenerateUtf8BomCsvForExcel() {
        User manager = managerUser();
        Venue venue = venue(manager);
        Booking booking = booking(55L, venue);
        GuestDietLogistics logistics = logistics(55L, booking, 2, 0, 0, 0);
        WeddingMenu standardMenu = weddingMenu(21L, venue, MenuType.STANDARD);

        when(bookingRepository.findById(55L)).thenReturn(Optional.of(booking));
        when(guestDietLogisticsRepository.findById(55L)).thenReturn(Optional.of(logistics));
        when(weddingMenuRepository.findByVenueIdAndMenuType(venue.getId(), MenuType.STANDARD)).thenReturn(Optional.of(standardMenu));
        when(recipeRepository.calculateShoppingItems(21L, 2)).thenReturn(List.of(
                new ShoppingItemDTO("Zolty ser", IngredientCategory.NABIAL, 1234.5, UnitOfMeasure.G)
        ));

        byte[] csv = shoppingListService.generateShoppingListCsv(manager, 55L);

        assertArrayEquals(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF}, new byte[]{csv[0], csv[1], csv[2]});

        String body = new String(csv, StandardCharsets.UTF_8);
        assertTrue(body.contains("Nazwa skladnika;Kategoria;Ilosc calkowita;Jednostka"));
        assertTrue(body.contains("Zolty ser;NABIAL;1.23;kg"));
    }

    @Test
    void shouldRejectAccessForOtherManager() {
        User owner = managerUser();
        User otherManager = managerUser();
        Booking booking = booking(66L, venue(owner));

        when(bookingRepository.findById(66L)).thenReturn(Optional.of(booking));

        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> shoppingListService.generateShoppingListCsv(otherManager, 66L)
        );

        assertEquals("Nie masz dostepu do tego bookingu", exception.getMessage());
        verify(guestDietLogisticsRepository, never()).findById(66L);
    }

    private User managerUser() {
        return User.builder()
                .id(UUID.randomUUID())
                .role(Role.builder().name("MANAGER").build())
                .build();
    }

    private Venue venue(User manager) {
        return Venue.builder()
                .id(7L)
                .manager(manager)
                .build();
    }

    private Booking booking(Long id, Venue venue) {
        return Booking.builder()
                .id(id)
                .venue(venue)
                .build();
    }

    private GuestDietLogistics logistics(
            Long bookingId,
            Booking booking,
            int standardCount,
            int vegetarianCount,
            int veganCount,
            int glutenFreeCount
    ) {
        return GuestDietLogistics.builder()
                .bookingId(bookingId)
                .booking(booking)
                .menuStandardCount(standardCount)
                .menuVegetarianCount(vegetarianCount)
                .menuVeganCount(veganCount)
                .menuGlutenFreeCount(glutenFreeCount)
                .build();
    }

    private WeddingMenu weddingMenu(Long id, Venue venue, MenuType menuType) {
        return WeddingMenu.builder()
                .id(id)
                .venue(venue)
                .menuType(menuType)
                .build();
    }
}
