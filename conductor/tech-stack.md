# Technology Stack: BinderUA

## Overview

BinderUA is built as a web application with a clear separation between its backend and frontend components, following a **monorepo structure** with a **Client-Server (API-driven) architecture**. The frontend is a Single Page Application (SPA) that consumes a RESTful API provided by the backend.

## Backend

The backend is developed using Java and the Spring Boot framework, providing a robust and scalable foundation for the application's business logic and data management.

*   **Programming Language:** Java 17 (as per pom.xml)
*   **Framework:** Spring Boot 3.1.12
*   **Database:** PostgreSQL 16 (Relational database for data storage)
*   **ORM/Persistence:** Spring Data JPA (for simplified data access), Flyway (for database migrations and version control)
*   **Security:** Spring Security (comprehensive security framework), JSON Web Tokens (JWT) using `jjwt` (for stateless authentication), BCrypt (for secure password hashing)
*   **Build Tool:** Maven (for project build automation and dependency management)
*   **Other Libraries:**
    *   Lombok (to reduce boilerplate code)
    *   Apache POI (for generating Excel reports)
    *   Testcontainers (for integration testing with real services like PostgreSQL)

## Frontend

The frontend is a modern, interactive user interface built with React and TypeScript, designed for an intuitive user experience.

*   **Programming Language:** TypeScript (for type-safe and scalable JavaScript development)
*   **Framework:** React (for building dynamic and responsive user interfaces)
*   **Build Tool:** Vite (for fast development and optimized production builds)
*   **Styling:** Tailwind CSS (utility-first CSS framework for rapid UI development), PostCSS (for transforming CSS with JavaScript plugins)
*   **Routing:** React Router DOM (for declarative client-side routing)
*   **Internationalization:** i18next (for multi-language support), react-i18next
*   **HTTP Client:** Axios (for making HTTP requests to the backend API)
