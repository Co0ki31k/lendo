package com.example.lendo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Błąd logowania - złe hasło lub email
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Object> handleBadCredentials(BadCredentialsException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "Nieprawidłowy adres email lub hasło");
    }

    // 2. Konto wyłączone (enabled = false)
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Object> handleDisabledAccount(DisabledException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "Twoje konto nie zostało jeszcze aktywowane");
    }

    // 3. Konto zablokowane
    @ExceptionHandler(LockedException.class)
    public ResponseEntity<Object> handleLockedAccount(LockedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "Twoje konto jest zablokowane");
    }

    // 4. Użytkownik nie istnieje
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Object> handleUsernameNotFound(UsernameNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // 5. Błędy biznesowe (np. zajęty email rzucony z Twojego serwisu)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Object> handleRuntimeException(RuntimeException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // 6. Ogólny błąd serwera (fallback)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneralException(Exception ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Wystąpił nieoczekiwany błąd serwera");
    }

    // Pomocnicza metoda do budowania spójnego JSONa
    private ResponseEntity<Object> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);

        return new ResponseEntity<>(body, status);
    }
}