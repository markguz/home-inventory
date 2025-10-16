# Gemini Project Context: Home Inventory

This document provides context for the Home Inventory project. It is intended to be used by the Gemini AI to understand the project and provide more accurate and relevant assistance.

## Project Overview

The Home Inventory project is a modern home inventory management system built with Next.js 15, TypeScript, and Prisma. It helps users track, organize, and manage their household items. The application is designed to be responsive and fast, with a focus on user experience.

### Key Technologies

*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Database:** SQLite with Prisma ORM
*   **UI Components:** shadcn/ui
*   **Styling:** Tailwind CSS
*   **Form Handling:** React Hook Form + Zod
*   **State Management:** TanStack Query
*   **Testing:** Vitest + Playwright

### Architecture

The project follows a standard Next.js App Router architecture.

*   `src/app`: Contains the Next.js App Router pages and API routes.
*   `src/components`: Contains the React components, organized by feature.
*   `src/lib`: Contains utility functions, the Prisma client, and Zod validation schemas.
*   `prisma`: Contains the database schema and migrations.
*   `tests`: Contains the test files, organized by type (unit, component, integration, e2e).

## Building and Running

### Prerequisites

*   Node.js 20.x or higher
*   npm or yarn

### Installation

1.  Clone the repository.
2.  Navigate to the `home-inventory` directory.
3.  Install dependencies:

    ```bash
    npm install
    ```

### Environment Variables

1.  Copy the example environment file:

    ```bash
    cp .env.example .env
    ```

2.  Update the `.env` file with your database URL.

### Database

1.  Initialize the database:

    ```bash
    npx prisma migrate dev
    ```

2.  (Optional) Seed the database with sample data:

    ```bash
    npm run db:seed
    ```

### Development Server

1.  Start the development server:

    ```bash
    npm run dev
    ```

2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

1.  Build the application:

    ```bash
    npm run build
    ```

2.  Start the production server:

    ```bash
    npm run start
    ```

## Development Conventions

### Testing

The project uses Vitest for unit, component, and integration testing, and Playwright for end-to-end testing.

*   Run all tests:

    ```bash
    npm run test:all
    ```

*   Run unit tests:

    ```bash
    npm run test:unit
    ```

*   Run component tests:

    ```bash
    npm run test:components
    ```

*   Run integration tests:

    ```bash
    npm run test:integration
    ```

*   Run end-to-end tests:

    ```bash
    npm run test:e2e
    ```

*   Run tests with coverage:

    ```bash
    npm run test:coverage
    ```

### Linting

The project uses ESLint for linting.

*   Run the linter:

    ```bash
    npm run lint
    ```

### Code Style

The project uses Prettier for code formatting. It is recommended to set up your editor to format on save.
