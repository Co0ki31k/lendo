package com.example.lendo.service;

import com.example.lendo.dto.ShoppingItemDTO;
import com.example.lendo.model.IngredientCategory;
import com.example.lendo.model.Role;
import com.example.lendo.model.UnitOfMeasure;
import com.example.lendo.model.User;
import com.example.lendo.model.Venue;
import com.example.lendo.model.WeddingMenu;
import com.example.lendo.repository.RecipeRepository;
import com.example.lendo.repository.WeddingMenuRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WeddingMenuShoppingServiceTest {
    @Mock
    private WeddingMenuRepository weddingMenuRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @InjectMocks
    private WeddingMenuShoppingService weddingMenuShoppingService;

    @Test
    void shouldReturnAggregatedShoppingList() {
        User manager = managerUser();
        List<ShoppingItemDTO> expected = List.of(
                new ShoppingItemDTO("Kurczak", IngredientCategory.MIESO, 12500.0, UnitOfMeasure.G),
                new ShoppingItemDTO("Marchew", IngredientCategory.WARZYWA_OWOCE, 8000.0, UnitOfMeasure.G)
        );

        when(weddingMenuRepository.findById(7L)).thenReturn(Optional.of(weddingMenu(manager)));
        when(recipeRepository.calculateShoppingItems(7L, 50)).thenReturn(expected);

        List<ShoppingItemDTO> actual = weddingMenuShoppingService.generateShoppingList(manager, 7L, 50);

        assertEquals(expected, actual);
        verify(recipeRepository).calculateShoppingItems(7L, 50);
    }

    @Test
    void shouldRejectNonPositiveGuestCount() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> weddingMenuShoppingService.generateShoppingList(managerUser(), 7L, 0)
        );

        assertEquals("Liczba gosci musi byc wieksza od zera", exception.getMessage());
        verify(weddingMenuRepository, never()).findById(7L);
    }

    @Test
    void shouldRejectMissingWeddingMenu() {
        when(weddingMenuRepository.findById(9L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> weddingMenuShoppingService.generateShoppingList(managerUser(), 9L, 120)
        );

        assertEquals("Menu weselne nie istnieje", exception.getMessage());
        verify(recipeRepository, never()).calculateShoppingItems(9L, 120);
    }

    @Test
    void shouldRejectAccessForAnotherManager() {
        User owner = managerUser();
        User otherManager = managerUser();

        when(weddingMenuRepository.findById(7L)).thenReturn(Optional.of(weddingMenu(owner)));

        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> weddingMenuShoppingService.generateShoppingList(otherManager, 7L, 50)
        );

        assertEquals("Nie masz dostepu do tego menu weselnego", exception.getMessage());
        verify(recipeRepository, never()).calculateShoppingItems(7L, 50);
    }

    private User managerUser() {
        return User.builder()
                .id(UUID.randomUUID())
                .role(Role.builder().name("MANAGER").build())
                .build();
    }

    private WeddingMenu weddingMenu(User manager) {
        Venue venue = Venue.builder()
                .manager(manager)
                .build();

        return WeddingMenu.builder()
                .id(7L)
                .booking(com.example.lendo.model.Booking.builder().venue(venue).build())
                .build();
    }
}
