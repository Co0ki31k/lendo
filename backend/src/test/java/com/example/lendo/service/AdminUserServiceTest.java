package com.example.lendo.service;

import com.example.lendo.model.Role;
import com.example.lendo.model.User;
import com.example.lendo.repository.RoleRepository;
import com.example.lendo.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private AccountAnonymizationService accountAnonymizationService;

    @InjectMocks
    private AdminUserService adminUserService;

    @Test
    void shouldAnonymizeUserInsteadOfDeleting() {
        UUID userId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email("user@example.com")
                .role(Role.builder().name("CLIENT").build())
                .isActive(true)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        adminUserService.deleteUser(userId, adminId);

        verify(accountAnonymizationService).anonymizeUser(user);
        verify(userRepository).save(user);
    }

    @Test
    void shouldRejectDeletingAlreadyInactiveUser() {
        UUID userId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email("deleted@example.com")
                .role(Role.builder().name("CLIENT").build())
                .isActive(false)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> adminUserService.deleteUser(userId, adminId)
        );

        assertEquals("To konto zostalo juz usuniete", exception.getMessage());
        verify(accountAnonymizationService, never()).anonymizeUser(any());
        verify(userRepository, never()).save(any());
    }
}
