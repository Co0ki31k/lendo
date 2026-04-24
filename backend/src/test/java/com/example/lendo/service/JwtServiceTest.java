package com.example.lendo.service;

import com.example.lendo.model.User;
import com.example.lendo.model.UserRole;
import com.nimbusds.jwt.proc.ExpiredJWTException;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecretKey", "super-secret-key-super-secret-key-123456");
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 900_000L);
    }

    @Test
    void shouldGenerateAndParseJwtToken() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("mateusz@example.com")
                .role(UserRole.ROLE_USER)
                .enabled(true)
                .provider("google")
                .build();

        String token = jwtService.generateAccessToken(user);

        assertNotNull(token);
        assertEquals("mateusz@example.com", jwtService.extractUsername(token));
        assertTrue(jwtService.isTokenValid(token, user));
        assertNotNull(jwtService.extractExpiration(token));
    }

    @Test
    void shouldFailWhenTokenIsExpired() {
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", -1000L);

        User user = User.builder()
                .email("test@lendo.pl")
                .role(UserRole.ROLE_USER)
                .build();
        String token = jwtService.generateAccessToken(user);

        assertThrows(ExpiredJwtException.class, ()->jwtService.isTokenValid(token, user));
    }

    @Test
    void shouldExtractSpecificClaims() {
        User user = User.builder()
                .email("mateusz@example.com")
                .role(UserRole.ROLE_USER)
                .build();

        String token = jwtService.generateAccessToken(user);

        String role = jwtService.extractClaim(token, claims -> claims.get("role", String.class));

        assertEquals("ROLE_USER", role);
    }
}

