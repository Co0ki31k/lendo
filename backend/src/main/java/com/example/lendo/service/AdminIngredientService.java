package com.example.lendo.service;

import com.example.lendo.dto.IngredientResponse;
import com.example.lendo.dto.IngredientUpsertRequest;
import com.example.lendo.model.Ingredient;
import com.example.lendo.repository.IngredientRepository;
import com.example.lendo.repository.RecipeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminIngredientService {
    private final IngredientRepository ingredientRepository;
    private final RecipeRepository recipeRepository;

    @Transactional
    public IngredientResponse createIngredient(IngredientUpsertRequest request) {
        Ingredient ingredient = ingredientRepository.save(
                Ingredient.builder()
                        .name(request.name().trim())
                        .category(request.category())
                        .defaultUnit(request.defaultUnit())
                        .wastePercentage(request.wastePercentage())
                        .build()
        );
        return IngredientResponse.from(ingredient);
    }

    @Transactional
    public IngredientResponse updateIngredient(Long ingredientId, IngredientUpsertRequest request) {
        Ingredient ingredient = requireIngredient(ingredientId);
        ingredient.setName(request.name().trim());
        ingredient.setCategory(request.category());
        ingredient.setDefaultUnit(request.defaultUnit());
        ingredient.setWastePercentage(request.wastePercentage());
        return IngredientResponse.from(ingredient);
    }

    @Transactional
    public void deleteIngredient(Long ingredientId) {
        Ingredient ingredient = requireIngredient(ingredientId);
        if (recipeRepository.existsByIngredientId(ingredientId)) {
            throw new RuntimeException("Nie mozna usunac skladnika powiazanego z receptura");
        }
        ingredientRepository.delete(ingredient);
    }

    @Transactional
    public IngredientResponse getIngredient(Long ingredientId) {
        return IngredientResponse.from(requireIngredient(ingredientId));
    }

    @Transactional
    public List<IngredientResponse> getIngredients() {
        return ingredientRepository.findAllByOrderByCategoryAscNameAsc().stream()
                .map(IngredientResponse::from)
                .toList();
    }

    private Ingredient requireIngredient(Long ingredientId) {
        return ingredientRepository.findById(ingredientId)
                .orElseThrow(() -> new RuntimeException("Skladnik nie istnieje"));
    }
}
