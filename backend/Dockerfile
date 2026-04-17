# Etap 1: Budowanie aplikacji (używamy Maven z Javą 21)
FROM maven:4.0.0-eclipse-temurin-21 AS build
COPY . .
RUN mvn clean package -DskipTests

# Etap 2: Uruchamianie aplikacji (używamy lekkiego obrazu Javy 21)
FROM eclipse-temurin:21-jre-jammy
COPY --from=build /target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]