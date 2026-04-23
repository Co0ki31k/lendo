package com.example.lendo;

import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
public class TestcontainersTest {
	@Container
	static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

	@Test
	void shouldStartPostgresContainer() {
		assertTrue(postgres.isRunning());
		System.out.println("✅ Docker i Postgres działają na porcie: " + postgres.getMappedPort(5432));
	}
}

