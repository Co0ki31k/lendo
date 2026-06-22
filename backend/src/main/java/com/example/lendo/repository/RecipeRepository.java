package com.example.lendo.repository;

import com.example.lendo.dto.ShoppingItemDTO;
import com.example.lendo.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    @Query("""
            select new com.example.lendo.dto.ShoppingItemDTO(
                ingredient.name,
                ingredient.category,
                sum((recipe.quantityPerGuest * :guestCount) / (1.0 - ingredient.wastePercentage)),
                ingredient.defaultUnit
            )
            from WeddingMenu weddingMenu
            join weddingMenu.dishes dish
            join dish.recipes recipe
            join recipe.ingredient ingredient
            where weddingMenu.id = :weddingMenuId
            group by ingredient.id, ingredient.name, ingredient.category, ingredient.defaultUnit
            order by ingredient.category, ingredient.name
            """)
    List<ShoppingItemDTO> calculateShoppingItems(@Param("weddingMenuId") Long weddingMenuId, @Param("guestCount") int guestCount);
}
