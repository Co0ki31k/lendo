package com.example.lendo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.time.LocalDateTime;

@Entity
@Table(name = "venue_inquiries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VenueInquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    @Column(name = "contact_email", nullable = false, length = 255)
    private String contactEmail;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
    private String messageText;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
