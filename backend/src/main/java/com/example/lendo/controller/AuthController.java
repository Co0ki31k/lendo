package com.example.lendo.controller;

import com.example.lendo.dto.AuthResponse;
import com.example.lendo.dto.LoginRequest;
import com.example.lendo.dto.RefreshTokenRequest;
import com.example.lendo.dto.RegisterRequest;
import com.example.lendo.service.AuthTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthTokenService authTokenService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = authTokenService.login(loginRequest);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        AuthResponse authResponse = authTokenService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);

    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest refreshTokenRequest) {
        AuthResponse authResponse = authTokenService.refreshAccessToken(String.valueOf(refreshTokenRequest));
        return ResponseEntity.ok(authResponse);
    }
}