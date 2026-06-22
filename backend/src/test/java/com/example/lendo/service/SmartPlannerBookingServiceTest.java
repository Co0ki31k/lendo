package com.example.lendo.service;

import com.example.lendo.model.Booking;
import com.example.lendo.model.BookingRequestStatus;
import com.example.lendo.model.BookingStatus;
import com.example.lendo.model.GuestDietLogistics;
import com.example.lendo.model.Role;
import com.example.lendo.model.User;
import com.example.lendo.model.Venue;
import com.example.lendo.model.VenueCalendar;
import com.example.lendo.repository.BookingRepository;
import com.example.lendo.repository.BookingStatusRepository;
import com.example.lendo.repository.ContractRepository;
import com.example.lendo.repository.GuestDietLogisticsRepository;
import com.example.lendo.repository.VenueCalendarRepository;
import com.example.lendo.repository.VenueRepository;
import com.example.lendo.repository.WeddDealRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SmartPlannerBookingServiceTest {
    @Mock
    private VenueRepository venueRepository;
    @Mock
    private VenueCalendarRepository venueCalendarRepository;
    @Mock
    private BookingStatusRepository bookingStatusRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private GuestDietLogisticsRepository guestDietLogisticsRepository;
    @Mock
    private ContractRepository contractRepository;
    @Mock
    private WeddDealRepository weddDealRepository;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private SmartPlannerBookingService smartPlannerBookingService;

    @Test
    void shouldDeleteFinishedBookingForVenueManager() {
        User manager = user("MANAGER");
        Booking booking = booking(manager, BookingRequestStatus.REJECTED);
        GuestDietLogistics logistics = GuestDietLogistics.builder()
                .booking(booking)
                .build();

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(guestDietLogisticsRepository.findById(booking.getId())).thenReturn(Optional.of(logistics));
        when(bookingStatusRepository.findByStatusName("AVAILABLE")).thenReturn(Optional.of(
                BookingStatus.builder().statusName("AVAILABLE").build()
        ));
        when(contractRepository.findByBookingId(booking.getId())).thenReturn(Optional.empty());

        smartPlannerBookingService.deleteManagerBooking(manager, booking.getId());

        verify(guestDietLogisticsRepository).deleteByBookingId(booking.getId());
        verify(bookingRepository).deleteById(booking.getId());
    }

    @Test
    void shouldRejectDeletingActiveBooking() {
        User manager = user("MANAGER");
        Booking booking = booking(manager, BookingRequestStatus.SUBMITTED);
        booking.getCalendar().setStatus(BookingStatus.builder().statusName("PROVISIONAL").build());
        booking.getCalendar().setProvisionalExpiresAt(LocalDateTime.now().plusHours(24));

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(bookingStatusRepository.findByStatusName("AVAILABLE")).thenReturn(Optional.of(
                BookingStatus.builder().statusName("AVAILABLE").build()
        ));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> smartPlannerBookingService.deleteManagerBooking(manager, booking.getId())
        );

        assertEquals("Mozna usuwac tylko zakonczone bookingi smartplannera", exception.getMessage());
        verify(guestDietLogisticsRepository, never()).deleteByBookingId(booking.getId());
        verify(bookingRepository, never()).deleteById(booking.getId());
    }

    @Test
    void shouldRejectDeletingBookingFromAnotherVenueManager() {
        User owner = user("MANAGER");
        User intruder = user("MANAGER");
        Booking booking = booking(owner, BookingRequestStatus.REJECTED);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        assertThrows(
                AccessDeniedException.class,
                () -> smartPlannerBookingService.deleteManagerBooking(intruder, booking.getId())
        );

        verify(guestDietLogisticsRepository, never()).deleteByBookingId(booking.getId());
        verify(bookingRepository, never()).deleteById(booking.getId());
    }

    private User user(String roleName) {
        return User.builder()
                .id(UUID.randomUUID())
                .role(Role.builder().name(roleName).build())
                .build();
    }

    private Booking booking(User manager, BookingRequestStatus status) {
        return Booking.builder()
                .id(15L)
                .venue(Venue.builder()
                        .id(10L)
                        .manager(manager)
                        .build())
                .calendar(VenueCalendar.builder()
                        .id(20L)
                        .status(BookingStatus.builder().statusName("AVAILABLE").build())
                        .build())
                .status(status)
                .client(user("CLIENT"))
                .estimatedGuests(100)
                .build();
    }
}
