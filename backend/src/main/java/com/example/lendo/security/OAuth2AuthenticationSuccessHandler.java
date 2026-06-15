package com.example.lendo.security;

import com.example.lendo.service.AuthTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthTokenService authTokenService;
    private final HttpCookieOAuth2AuthorizationRequestRepository authorizationRequestRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        if (email == null) {
            throw new RuntimeException("Email not found from OAuth2 provider");
        }

        String name = oAuth2User.getAttribute("name");

        if (name == null || name.isBlank()) {
            name = email.split("@")[0];
        }

        var authResponse = authTokenService.generateTokensForOAuth2User(email, name);

        authorizationRequestRepository.removeAuthorizationRequest(request, response);

        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/callback")
                .queryParam("token", authResponse.accessToken())
                .queryParam("refresh_token", authResponse.refreshToken())
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
