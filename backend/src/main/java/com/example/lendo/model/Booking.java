package com.example.lendo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calendar_id", nullable = false)
    private VenueCalendar calendar;

    @Column(name = "estimated_guests", nullable = false)
    private Integer estimatedGuests;

    @Column(name = "price_per_guest", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerGuest;

    @Column(name = "max_price_per_guest", nullable = false, precision = 10, scale = 2)
    private BigDecimal maxPricePerGuest;

    @Column(name = "total_estimated_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalEstimatedCost;

    @Column(name = "full_service", nullable = false)
    @Builder.Default
    private boolean fullService = false;

    @Column(name = "service_notes")
    private String serviceNotes;

    @Column(name = "client_request_notes")
    private String clientRequestNotes;

    @Column(name = "pending_change_payload")
    private String pendingChangePayload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BookingRequestStatus status = BookingRequestStatus.SUBMITTED;

    @Column(name = "decision_comment")
    private String decisionComment;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
