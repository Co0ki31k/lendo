package com.example.lendo.service;

import com.example.lendo.dto.ShoppingItemDTO;
import com.example.lendo.model.Booking;
import com.example.lendo.model.GuestDietLogistics;
import com.example.lendo.model.IngredientCategory;
import com.example.lendo.model.MenuType;
import com.example.lendo.model.UnitOfMeasure;
import com.example.lendo.model.User;
import com.example.lendo.model.WeddingMenu;
import com.example.lendo.repository.BookingRepository;
import com.example.lendo.repository.GuestDietLogisticsRepository;
import com.example.lendo.repository.RecipeRepository;
import com.example.lendo.repository.WeddingMenuRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.UncheckedIOException;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ShoppingListService {
    private static final byte[] UTF8_BOM = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
    private static final String CSV_SEPARATOR = ";";

    private final BookingRepository bookingRepository;
    private final GuestDietLogisticsRepository guestDietLogisticsRepository;
    private final WeddingMenuRepository weddingMenuRepository;
    private final RecipeRepository recipeRepository;

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<ShoppingItemDTO> generateShoppingList(User user, Long bookingId) {
        Booking booking = requireBooking(bookingId);
        validateAccess(user, booking);
        GuestDietLogistics logistics = requireDietLogistics(bookingId);
        return generateShoppingList(booking, logistics);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public byte[] generateShoppingListCsv(User user, Long bookingId) {
        Booking booking = requireBooking(bookingId);
        validateAccess(user, booking);
        GuestDietLogistics logistics = requireDietLogistics(bookingId);
        return buildShoppingListCsv(generateShoppingList(booking, logistics));
    }

    private List<ShoppingItemDTO> generateShoppingList(Booking booking, GuestDietLogistics logistics) {
        Map<MenuType, Integer> guestCountByMenu = resolveGuestCountByMenu(logistics);
        List<ShoppingItemDTO> aggregatedItems = new ArrayList<>();

        for (Map.Entry<MenuType, Integer> entry : guestCountByMenu.entrySet()) {
            int guestCount = entry.getValue();
            if (guestCount <= 0) {
                continue;
            }

            WeddingMenu weddingMenu = weddingMenuRepository.findByVenueIdAndMenuType(booking.getVenue().getId(), entry.getKey())
                    .orElseThrow(() -> new RuntimeException("Brakuje menu " + entry.getKey() + " dla obiektu bookingu"));

            aggregatedItems.addAll(recipeRepository.calculateShoppingItems(weddingMenu.getId(), guestCount));
        }

        return mergeShoppingItems(aggregatedItems);
    }

    private byte[] buildShoppingListCsv(List<ShoppingItemDTO> shoppingItems) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try {
            outputStream.write(UTF8_BOM);

            try (Writer writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8)) {
                writeCsvLine(writer, "Nazwa skladnika", "Kategoria", "Ilosc calkowita", "Jednostka");
                for (ShoppingItemDTO item : shoppingItems) {
                    CsvShoppingItem csvItem = normalizeForCsv(item);
                    writeCsvLine(
                            writer,
                            csvItem.ingredientName(),
                            csvItem.category(),
                            formatQuantity(csvItem.totalQuantity()),
                            csvItem.unit()
                    );
                }
                writer.flush();
            }
        } catch (IOException exception) {
            throw new UncheckedIOException("Nie udalo sie wygenerowac pliku CSV listy zakupow", exception);
        }

        return outputStream.toByteArray();
    }

    private Booking requireBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking nie istnieje"));
    }

    private GuestDietLogistics requireDietLogistics(Long bookingId) {
        return guestDietLogisticsRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Brak danych logistycznych dla bookingu"));
    }

    private void validateAccess(User user, Booking booking) {
        if ("ADMIN".equals(user.getRoleName())) {
            return;
        }

        if (!Objects.equals(booking.getVenue().getManager().getId(), user.getId())) {
            throw new AccessDeniedException("Nie masz dostepu do tego bookingu");
        }
    }

    private Map<MenuType, Integer> resolveGuestCountByMenu(GuestDietLogistics logistics) {
        Map<MenuType, Integer> guestCountByMenu = new EnumMap<>(MenuType.class);
        guestCountByMenu.put(MenuType.STANDARD, defaultIfNull(logistics.getMenuStandardCount()));
        guestCountByMenu.put(MenuType.VEGETARIAN, defaultIfNull(logistics.getMenuVegetarianCount()));
        guestCountByMenu.put(MenuType.VEGAN, defaultIfNull(logistics.getMenuVeganCount()));
        guestCountByMenu.put(MenuType.GLUTEN_FREE, defaultIfNull(logistics.getMenuGlutenFreeCount()));
        return guestCountByMenu;
    }

    private List<ShoppingItemDTO> mergeShoppingItems(List<ShoppingItemDTO> shoppingItems) {
        Map<ShoppingItemKey, Double> quantitiesByIngredient = new LinkedHashMap<>();

        for (ShoppingItemDTO item : shoppingItems) {
            ShoppingItemKey key = new ShoppingItemKey(item.ingredientName(), item.category(), item.unit());
            quantitiesByIngredient.merge(key, item.totalQuantity(), Double::sum);
        }

        return quantitiesByIngredient.entrySet().stream()
                .map(entry -> new ShoppingItemDTO(
                        entry.getKey().ingredientName(),
                        entry.getKey().category(),
                        entry.getValue(),
                        entry.getKey().unit()
                ))
                .sorted(Comparator.comparing((ShoppingItemDTO item) -> item.category().name())
                        .thenComparing(ShoppingItemDTO::ingredientName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private void writeCsvLine(Writer writer, String... columns) throws IOException {
        for (int index = 0; index < columns.length; index++) {
            if (index > 0) {
                writer.write(CSV_SEPARATOR);
            }
            writer.write(escapeCsv(columns[index]));
        }
        writer.write("\r\n");
    }

    private String escapeCsv(String value) {
        String normalized = value == null ? "" : value;
        boolean needsQuotes = normalized.contains(CSV_SEPARATOR)
                || normalized.contains("\"")
                || normalized.contains("\n")
                || normalized.contains("\r");
        if (!needsQuotes) {
            return normalized;
        }
        return "\"" + normalized.replace("\"", "\"\"") + "\"";
    }

    private String formatQuantity(double value) {
        return String.format(java.util.Locale.US, "%.2f", value);
    }

    private CsvShoppingItem normalizeForCsv(ShoppingItemDTO item) {
        return switch (item.unit()) {
            case G -> new CsvShoppingItem(item.ingredientName(), item.category().name(), item.totalQuantity() / 1000.0, "kg");
            case ML -> new CsvShoppingItem(item.ingredientName(), item.category().name(), item.totalQuantity() / 1000.0, "L");
            case SZT -> new CsvShoppingItem(item.ingredientName(), item.category().name(), item.totalQuantity(), "SZT");
        };
    }

    private int defaultIfNull(Integer value) {
        return value == null ? 0 : value;
    }

    private record ShoppingItemKey(String ingredientName, IngredientCategory category, UnitOfMeasure unit) {
        private ShoppingItemKey {
            Objects.requireNonNull(ingredientName);
            Objects.requireNonNull(category);
            Objects.requireNonNull(unit);
        }
    }

    private record CsvShoppingItem(String ingredientName, String category, double totalQuantity, String unit) {
    }
}
