package com.example.lendo.service;

import com.example.lendo.dto.IngredientUpsertRequest;
import com.example.lendo.model.Ingredient;
import com.example.lendo.model.IngredientCategory;
import com.example.lendo.model.UnitOfMeasure;
import com.example.lendo.repository.IngredientRepository;
import com.example.lendo.repository.RecipeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminIngredientServiceTest {
    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @InjectMocks
    private AdminIngredientService adminIngredientService;

    @Test
    void shouldCreateIngredient() {
        when(ingredientRepository.save(any(Ingredient.class))).thenAnswer(invocation -> {
            Ingredient ingredient = invocation.getArgument(0);
            ingredient.setId(5L);
            return ingredient;
        });

        var response = adminIngredientService.createIngredient(
                new IngredientUpsertRequest(" Maslo ", IngredientCategory.NABIAL, UnitOfMeasure.G, 0.05)
        );

        assertEquals(5L, response.id());
        assertEquals("Maslo", response.name());
    }

    @Test
    void shouldRejectDeletingIngredientUsedInRecipe() {
        when(ingredientRepository.findById(8L)).thenReturn(Optional.of(
                Ingredient.builder()
                        .id(8L)
                        .name("Kurczak")
                        .category(IngredientCategory.MIESO)
                        .defaultUnit(UnitOfMeasure.G)
                        .wastePercentage(0.1)
                        .build()
        ));
        when(recipeRepository.existsByIngredientId(8L)).thenReturn(true);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> adminIngredientService.deleteIngredient(8L)
        );

        assertEquals("Nie mozna usunac skladnika powiazanego z receptura", exception.getMessage());
        verify(ingredientRepository, never()).delete(any(Ingredient.class));
    }
}
