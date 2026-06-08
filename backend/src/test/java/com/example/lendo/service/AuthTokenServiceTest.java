package com.example.lendo.service;

import com.example.lendo.dto.AuthResponse;
import com.example.lendo.dto.LoginRequest;
import com.example.lendo.dto.RegisterRequest;
import com.example.lendo.model.RefreshToken;
import com.example.lendo.model.Role;
import com.example.lendo.model.User;
import com.example.lendo.repository.RoleRepository;
import com.example.lendo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthTokenServiceTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthTokenService authTokenService;

    private User testUser;
    private RefreshToken testRefreshToken;
    private Role clientRole;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authTokenService, "jwtExpirationMs", 3600L);
        clientRole = Role.builder()
                .id(2)
                .name("CLIENT")
                .build();
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .passwordHash("hashedPassword123")
                .firstName("Test")
                .lastName("User")
                .role(clientRole)
                .isActive(true)
                .provider("local")
                .build();

        testRefreshToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .token("refresh-token-123")
                .user(testUser)
                .expiryDate(OffsetDateTime.now().plusDays(7))
                .build();
    }

    @Test
    void shouldLoginSuccessfully() {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(request.email(), request.password());
        when(authenticationManager.authenticate(authRequest)).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(jwtService.generateAccessToken(testUser)).thenReturn("access-token-123");
        when(refreshTokenService.createRefreshToken(testUser.getId())).thenReturn(testRefreshToken);

        AuthResponse response = authTokenService.login(request);

        assertNotNull(response);
        assertEquals("access-token-123", response.accessToken());
        assertEquals("refresh-token-123", response.refreshToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals("test@example.com", response.user().email());
        assertEquals("Test", response.user().firstName());
        assertEquals("User", response.user().lastName());
    }

    @Test
    void shouldThrowExceptionWhenInvalidEmail() {
        LoginRequest request = new LoginRequest("invalid@example.com", "password123");

        UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(request.email(), request.password());
        when(authenticationManager.authenticate(authRequest)).thenThrow(new RuntimeException("Bad credentials"));

        assertThrows(RuntimeException.class, () -> authTokenService.login(request));
    }

     @Test
     void shouldThrowExceptionWhenInvalidPassword() {
        LoginRequest request = new LoginRequest("test@example.com", "wrongPassword");

        UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(request.email(), request.password());
        when(authenticationManager.authenticate(authRequest)).thenThrow(new RuntimeException("Bad credentials"));

        assertThrows(RuntimeException.class, () -> authTokenService.login(request));
    }

    @Test
    void shouldRegisterSuccessfully() {
        RegisterRequest request = new RegisterRequest("newuser@example.com", "password123", "New", "User", null);

        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword123");
        when(roleRepository.findByName("CLIENT")).thenReturn(Optional.of(clientRole));
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtService.generateAccessToken(testUser)).thenReturn("access-token-123");
        when(refreshTokenService.createRefreshToken(testUser.getId())).thenReturn(testRefreshToken);

        AuthResponse response = authTokenService.register(request);

        assertNotNull(response);
        assertEquals("access-token-123", response.accessToken());
        assertEquals("refresh-token-123", response.refreshToken());
    }

    @Test
    void shouldThrowExceptionWhenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest("existing@example.com", "password123", "Existing", "User", null);

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> authTokenService.register(request));
    }

    @Test
    void shouldRefreshAccessTokenSuccessfully() {
        String newAccessToken = "new-access-token-456";

        when(refreshTokenService.findByToken("refresh-token-123"))
                .thenReturn(Optional.of(testRefreshToken));
        when(refreshTokenService.verifyExpiration(testRefreshToken))
                .thenReturn(testRefreshToken);
        when(jwtService.generateAccessToken(testUser))
                .thenReturn(newAccessToken);

        AuthResponse response = authTokenService.refreshAccessToken("refresh-token-123");

        assertNotNull(response);
        assertEquals(newAccessToken, response.accessToken());
        assertEquals("refresh-token-123", response.refreshToken());
    }
}
