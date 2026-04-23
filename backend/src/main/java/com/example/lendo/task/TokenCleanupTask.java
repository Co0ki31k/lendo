package com.example.lendo.task;


import com.example.lendo.repository.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupTask {
    private final RefreshTokenRepository refreshTokenRepository;

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void removeExpiredTokens() {
        log.info("Starting scheduled cleanup of expired refresh tokens.");
        int deleteCount = refreshTokenRepository.deleteByExpiryDateBefore(OffsetDateTime.now());

        if(deleteCount > 0) {
            log.info("Cleanup successful. Removed {} expired tokens from database.", deleteCount);
        }
        else{
            log.info("Cleanup finished. No expired tokens found.");
        }
    }
}
