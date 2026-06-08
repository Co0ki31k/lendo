package com.example.lendo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "guest_diet_logistics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestDietLogistics {
    @Id
    @Column(name = "booking_id")
    private Long bookingId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "menu_standard_count", nullable = false)
    @Builder.Default
    private Integer menuStandardCount = 0;

    @Column(name = "menu_vegetarian_count", nullable = false)
    @Builder.Default
    private Integer menuVegetarianCount = 0;

    @Column(name = "menu_vegan_count", nullable = false)
    @Builder.Default
    private Integer menuVeganCount = 0;

    @Column(name = "menu_gluten_free_count", nullable = false)
    @Builder.Default
    private Integer menuGlutenFreeCount = 0;

    @Lob
    @Column(name = "allergies_notes")
    private String allergiesNotes;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

