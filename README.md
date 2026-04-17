# Lendo – P2P Rental Marketplace 🔄

**Share what you have, rent what you need.**

## 🌟 O projekcie
Lendo to nowoczesna platforma typu Peer-to-Peer Marketplace, umożliwiająca krótkoterminowy wynajem dowolnych przedmiotów. Projekt realizowany w ramach przedmiotu **Zaawansowane Aplikacje Internetowe**.

## 🛠️ Stack Technologiczny
* **Backend:** Java 17, Spring Boot 3, Spring Security, Hibernate
* **Frontend:** React.js, Tailwind CSS, Vite
* **Baza danych:** PostgreSQL (Neon.tech)
* **Inne:** Cloudinary (zdjęcia), GitHub Actions (CI/CD)

## 🏗️ Architektura
Projekt wykorzystuje architekturę monorepo:
* `/backend` – serwer REST API (Spring Boot)
* `/frontend` – aplikacja kliencza (React)

## 🚀 Uruchomienie lokalne
1. Sklonuj repozytorium: `git clone https://github.com/Co0ki31k/lendo.git`
2. Backend: Przejdź do `/backend` i uruchom `./mvnw spring-boot:run`
3. Frontend: Przejdź do `/frontend`, wykonaj `npm install` i `npm run dev`