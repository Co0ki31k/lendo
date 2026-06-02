package com.example.lendo.service;

import com.example.lendo.dto.AuthResponse;
import com.example.lendo.dto.LoginRequest;
import com.example.lendo.dto.RegisterRequest;
import com.example.lendo.model.RefreshToken;
import com.example.lendo.model.User;
import com.example.lendo.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthTokenService {

    private final AuthenticationManager authenticationManager;
    @Value("${spring.security.jwt.expiration}")
    private Long jwtExpirationMs;

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(request.email(),request.password());

        Authentication authResult = authenticationManager.authenticate(authRequest);

        if(authResult.getPrincipal() instanceof User user) {
            String accessToken = jwtService.generateAccessToken(user);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
            return buildAuthResponse(user, accessToken, refreshToken.getToken());
        }

       throw new IllegalStateException("System authentication error: Principal is not a User entity");
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .phoneNumber(request.phoneNumber())
                .provider("LOCAL")
                .roleId(2)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return buildAuthResponse(user, accessToken, refreshToken.getToken());
    }

    @Transactional
    public AuthResponse refreshAccessToken(String refreshToken) {
        RefreshToken token = refreshTokenService.findByToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        RefreshToken verifiedToken = refreshTokenService.verifyExpiration(token);
        User user = verifiedToken.getUser();

        String newAccessToken = jwtService.generateAccessToken(user);

        return buildAuthResponse(user, newAccessToken, refreshToken);
    }

    @Transactional
    public void logout(UUID userId) {
        refreshTokenService.deleteUserId(userId);
    }

    @Transactional
    public AuthResponse generateTokensForOAuth2User(String email, String fullName) {
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    String[] nameParts = fullName != null ? fullName.trim().split("\\s+", 2) : new String[0];
                    String firstName = nameParts.length > 0 ? nameParts[0] : null;
                    String lastName = nameParts.length > 1 ? nameParts[1] : null;

                    User newUser = User.builder()
                            .email(email)
                            .firstName(firstName)
                            .lastName(lastName)
                            .provider("GOOGLE")
                            .roleId(2)
                            .isActive(true)
                            .passwordHash(null)
                            .build();
                    return userRepository.save(newUser);
                });

        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return buildAuthResponse(user, accessToken, refreshToken.getToken());
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.of(user, accessToken, refreshToken, jwtExpirationMs/1000, "Bearer");
    }
}
