package com.example.lendo.model;

import jakarta.persistence.Column;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "venues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Venue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @Column(nullable = false, length = 150)
    private String name;

    @Column
    private String description;

    @Column(nullable = false, length = 50)
    private String style;

    @Column(name = "capacity_min", nullable = false)
    private Integer capacityMin;

    @Column(name = "capacity_max", nullable = false)
    private Integer capacityMax;

    @Column(name = "has_accommodation", nullable = false)
    private boolean hasAccommodation = false;

    @Column(name = "accommodation_places", nullable = false)
    private Integer accommodationPlaces = 0;

    @Column(name = "base_price_per_guest", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePricePerGuest;

    @Column(name = "no_corkage_fee", nullable = false)
    private boolean noCorkageFee = false;

    @Column(name = "civil_wedding_garden", nullable = false)
    private boolean civilWeddingGarden = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_verified", nullable = false)
    private boolean verified = false;

    @OneToMany(mappedBy = "venue", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    @Builder.Default
    private Set<VenueImage> images = new HashSet<>();
}
