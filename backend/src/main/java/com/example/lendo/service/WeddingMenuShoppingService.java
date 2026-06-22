package com.example.lendo.service;

import com.example.lendo.dto.ShoppingItemDTO;
import com.example.lendo.model.User;
import com.example.lendo.model.WeddingMenu;
import com.example.lendo.repository.RecipeRepository;
import com.example.lendo.repository.WeddingMenuRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WeddingMenuShoppingService {
    private final WeddingMenuRepository weddingMenuRepository;
    private final RecipeRepository recipeRepository;

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<ShoppingItemDTO> generateShoppingList(User user, Long weddingMenuId, int guestCount) {
        validateInput(weddingMenuId, guestCount);

        WeddingMenu weddingMenu = weddingMenuRepository.findById(weddingMenuId)
                .orElseThrow(() -> new RuntimeException("Menu weselne nie istnieje"));

        validateAccess(user, weddingMenu);

        return recipeRepository.calculateShoppingItems(weddingMenuId, guestCount);
    }

    private void validateAccess(User user, WeddingMenu weddingMenu) {
        if ("ADMIN".equals(user.getRoleName())) {
            return;
        }

        if (!weddingMenu.getBooking().getVenue().getManager().getId().equals(user.getId())) {
            throw new AccessDeniedException("Nie masz dostepu do tego menu weselnego");
        }
    }

    private void validateInput(Long weddingMenuId, int guestCount) {
        if (weddingMenuId == null) {
            throw new IllegalArgumentException("Id menu weselnego jest wymagane");
        }
        if (guestCount <= 0) {
            throw new IllegalArgumentException("Liczba gosci musi byc wieksza od zera");
        }
    }
}
