# Badilni Admin Panel

A feature-rich Angular admin interface for managing the Badilni platform — covering users, listings, categories, transactions, disputes, bookings, and more.

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Core Architecture](#core-architecture)
- [Modules & Features](#modules--features)
- [Shared Utilities](#shared-utilities)
- [Environment Configuration](#environment-configuration)

---

## Overview

Badilni Admin is an Angular-based single-page application (SPA) that provides administrators with a centralized dashboard to monitor and manage all aspects of the Badilni platform. It includes authentication, role-based access control, audit logging, and real-time stats.

---

## Project Structure

```
badilni-admin/
├── src/
│   ├── app/
│   │   ├── core/                         # Singleton services, guards, interceptors, models
│   │   │   ├── guards/
│   │   │   │   ├── admin-guard.spec.ts   # ✅ Tests: route blocking for non-admins
│   │   │   │   ├── admin-guard.ts        # Restricts routes to admin users
│   │   │   │   ├── auth-guard.spec.ts    # ✅ Tests: redirect when unauthenticated
│   │   │   │   └── auth-guard.ts         # Protects authenticated routes
│   │   │   ├── interceptors/
│   │   │   │   ├── auth-interceptor.spec.ts   # ✅ Tests: token injection in headers
│   │   │   │   ├── auth-interceptor.ts        # Attaches auth tokens to HTTP requests
│   │   │   │   ├── error-interceptor.spec.ts  # ✅ Tests: 401/403/500 error handling
│   │   │   │   └── error-interceptor.ts       # Global HTTP error handling
│   │   │   ├── models/
│   │   │   │   ├── admin-action.ts
│   │   │   │   ├── auth-response.ts
│   │   │   │   ├── booking.ts
│   │   │   │   ├── category.ts
│   │   │   │   ├── dashboard-stats.ts
│   │   │   │   ├── index.ts              # Barrel export for all models
│   │   │   │   ├── review.ts
│   │   │   │   ├── transaction.ts
│   │   │   │   └── user.ts
│   │   │   └── services/
│   │   │       ├── audit-log.spec.ts     # ✅ Tests: fetching & filtering audit entries
│   │   │       ├── audit-log.ts
│   │   │       ├── auth.spec.ts          # ✅ Tests: login, logout, token storage
│   │   │       ├── auth.ts
│   │   │       ├── categories.spec.ts    # ✅ Tests: CRUD operations for categories
│   │   │       ├── categories.ts
│   │   │       ├── dashboard.spec.ts     # ✅ Tests: stats fetching & data mapping
│   │   │       ├── dashboard.ts
│   │   │       ├── disputes.spec.ts      # ✅ Tests: dispute resolution actions
│   │   │       ├── disputes.ts
│   │   │       ├── listings.spec.ts      # ✅ Tests: listing retrieval & moderation
│   │   │       ├── listings.ts
│   │   │       ├── transactions.spec.ts  # ✅ Tests: transaction queries & pagination
│   │   │       ├── transactions.ts
│   │   │       ├── users.spec.ts         # ✅ Tests: user search, update, ban actions
│   │   │       └── users.ts
│   │   ├── features/                     # Feature modules (lazy-loaded)
│   │   │   ├── audit-log/
│   │   │   │   ├── audit-log.css
│   │   │   │   ├── audit-log.html
│   │   │   │   ├── audit-log.spec.ts     # ✅ Tests: component rendering & filters
│   │   │   │   └── audit-log.ts
│   │   │   ├── auth/
│   │   │   │   ├── forgot-password/
│   │   │   │   │   ├── forgot-password.css
│   │   │   │   │   ├── forgot-password.html
│   │   │   │   │   ├── forgot-password.spec.ts         
│   │   │   │   │   └── forgot-password.ts
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.css
│   │   │   │   │   ├── login.html
│   │   │   │   │   ├── login.spec.ts         # ✅ Tests: form validation & auth flow
│   │   │   │   │   └── login.ts
│   │   │   │   ├── reset-password/
│   │   │   │   │   ├── reset-password.css
│   │   │   │   │   ├── reset-password.html
│   │   │   │   │   ├── reset-password.spec.ts         
│   │   │   │   │   └── reset-password.ts
│   │   │   │   └── verify-email/
│   │   │   │       ├── verify-email.css
│   │   │   │       ├── verify-email.html
│   │   │   │       ├── verify-email.spec.ts         
│   │   │   │       └── verify-email.ts
│   │   │   ├── categories/
│   │   │   │   ├── categories.css
│   │   │   │   ├── categories.html
│   │   │   │   ├── categories.spec.ts    # ✅ Tests: list display & CRUD interactions
│   │   │   │   └── categories.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.css
│   │   │   │   ├── dashboard.html
│   │   │   │   ├── dashboard.spec.ts     # ✅ Tests: stats binding & widget rendering
│   │   │   │   └── dashboard.ts
│   │   │   ├── disputes/
│   │   │   │   ├── disputes.css
│   │   │   │   ├── disputes.html
│   │   │   │   ├── disputes.spec.ts      # ✅ Tests: dispute actions & status updates
│   │   │   │   └── disputes.ts
│   │   │   ├── listings/
│   │   │   │   ├── listings.css
│   │   │   │   ├── listings.html
│   │   │   │   ├── listings.spec.ts      # ✅ Tests: listing table & moderation actions
│   │   │   │   └── listings.ts
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.css
│   │   │   │   ├── notifications.html
│   │   │   │   ├── notifications.spec.ts # ✅ Tests: notification list & read state
│   │   │   │   └── notifications.ts
│   │   │   ├── transactions/
│   │   │   │   ├── transactions.css
│   │   │   │   ├── transactions.html
│   │   │   │   ├── transactions.spec.ts  # ✅ Tests: transaction table & filters
│   │   │   │   └── transactions.ts
│   │   │   └── users/
│   │   │       ├── users.css
│   │   │       ├── users.html
│   │   │       ├── users.spec.ts         # ✅ Tests: user table, search & actions
│   │   │       └── users.ts
│   │   ├── shared/                       # Reusable components, directives, pipes
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── layout.css
│   │   │   │   │   ├── layout.html
│   │   │   │   │   ├── layout.spec.ts    # ✅ Tests: shell rendering & outlet projection
│   │   │   │   │   └── layout.ts
│   │   │   │   └── sidebar/
│   │   │   │       ├── sidebar.css
│   │   │   │       ├── sidebar.html
│   │   │   │       ├── sidebar.spec.ts   # ✅ Tests: nav links & active route state
│   │   │   │       └── sidebar.ts
│   │   │   ├── directives/
│   │   │   │   ├── auto-focus.spec.ts    # ✅ Tests: focus triggered on init
│   │   │   │   ├── auto-focus.ts
│   │   │   │   ├── click-outside.spec.ts # ✅ Tests: event emitted on outside click
│   │   │   │   ├── click-outside.ts
│   │   │   │   ├── has-role.spec.ts      # ✅ Tests: element visibility by role
│   │   │   │   ├── has-role.ts
│   │   │   │   └── index.ts             # Barrel export
│   │   │   └── pipes/
│   │   │       ├── credit-format-pipe.spec.ts  # ✅ Tests: currency formatting cases
│   │   │       ├── credit-format-pipe.ts
│   │   │       ├── index.ts                    # Barrel export
│   │   │       ├── time-ago-pipe.spec.ts        # ✅ Tests: relative time accuracy
│   │   │       ├── time-ago-pipe.ts
│   │   │       ├── truncate-pipe.spec.ts        # ✅ Tests: length limits & ellipsis
│   │   │       └── truncate-pipe.ts
│   │   ├── app.config.ts
│   │   ├── app.css
│   │   ├── app.html
│   │   ├── app.routes.ts
│   │   ├── app.spec.ts
│   │   └──app.ts
│   ├── environments/                     # Environment-specific config
│   │   ├── environment.development.ts    # Dev-specific variables (local API, debug flags)
│   │   └── environment.ts               # Default/production environment variables
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── angular.json
├── package-lock.json
├── package.json
├── postcss.config.js                     # for Tailwind CSS
├── README.md
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json
```

---

## Features

- **Authentication** — Login with JWT-based auth; tokens attached automatically via HTTP interceptor
- **Role-Based Access Control** — Admin and auth guards protect routes; `hasRole` directive controls UI visibility
- **Dashboard** — High-level stats and KPIs for the platform
- **User Management** — View, search, and manage platform users
- **Listings Management** — Browse and moderate item listings
- **Categories** — Create and manage listing categories
- **Transactions** — Track and review financial transactions
- **Disputes** — Handle and resolve user disputes
- **Notifications** — Platform-wide notifications management
- **Audit Log** — Full activity history for admin actions
- **Global Error Handling** — Centralized HTTP error interceptor
- **Shared UI** — Layout shell, sidebar navigation, reusable pipes and directives

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Angular CLI](https://angular.io/cli) v16 or later

```bash
npm install -g @angular/cli
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/badilni-admin.git
cd badilni-admin

# Install dependencies
npm install
```

### Running the App

```bash
ng serve
```

Navigate to `http://localhost:4200`. The app will reload automatically on file changes.

---

## Available Scripts

| Command | Description |
|---|---|
| `ng serve` | Start the dev server at `localhost:4200` |
| `ng build` | Build the app for production (`dist/`) |
| `ng test` | Run unit tests in watch mode via Karma |
| `ng test --watch=false` | Run unit tests once (CI-friendly) |
| `ng test --coverage` | Run tests and generate coverage report |
| `ng lint` | Lint the project with ESLint |
| `ng build --configuration production` | Production build with optimizations |

---

## Testing

The project follows Angular's testing conventions using **Karma** + **Jasmine**. Every class that contains logic has a corresponding `.spec.ts` file sitting next to it.

### Test Coverage Map

| Layer | Spec Files | What's Tested |
|---|---|---|
| **Guards** | `admin-guard.spec.ts`, `auth-guard.spec.ts` | Route blocking, redirect behaviour |
| **Interceptors** | `auth-interceptor.spec.ts`, `error-interceptor.spec.ts` | Token injection, HTTP error responses |
| **Services** | `auth`, `users`, `listings`, `categories`, `transactions`, `disputes`, `dashboard`, `audit-log` | API calls, data mapping, error paths |
| **Feature Components** | All 9 feature folders | Component rendering, user interactions, service integration |
| **Shared Components** | `layout.spec.ts`, `sidebar.spec.ts` | Shell rendering, routing state |
| **Directives** | `auto-focus`, `click-outside`, `has-role` | DOM behaviour, event emission, role visibility |
| **Pipes** | `credit-format-pipe`, `time-ago-pipe`, `truncate-pipe` | Transform edge cases, boundary values |
| **Root** | `app.spec.ts` | App bootstrap and root component |

### Running Tests

```bash
# Run all unit tests (single run)
ng test --watch=false

# Run in watch mode during development
ng test

# Run with code coverage report
ng test --coverage
```

Coverage output is generated in `coverage/badilni-admin/index.html`.

### Writing Tests

Each spec file follows this pattern:

```ts
describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    TestBed.configureTestingModule({ ... });
    service = TestBed.inject(ServiceName);
  });

  it('should do X when Y', () => {
    // Arrange - Act - Assert
  });
});
```

> **Convention:** spec files live alongside their source file (not in a separate `__tests__` folder), keeping context close to the code.

---

## Core Architecture

### Guards

| Guard | Purpose |
|---|---|
| `AuthGuard` | Redirects unauthenticated users to login |
| `AdminGuard` | Restricts access to admin-only routes |

### Interceptors

| Interceptor | Purpose |
|---|---|
| `AuthInterceptor` | Injects JWT token into outgoing HTTP headers |
| `ErrorInterceptor` | Catches HTTP errors and handles them globally |

### Models

Core TypeScript interfaces shared across the app:

`AdminAction` · `Booking` · `Category` · `DashboardStats` · `Review` · `Transaction` · `User`

---

## Modules & Features

Each feature module under `src/app/features/` follows the same structure:

```
feature-name/
├── feature-name.css
├── feature-name.html
├── feature-name.spec.ts
└── feature-name.ts
```

| Feature | Description |
|---|---|
| `auth/login` | Login page and authentication flow |
| `dashboard` | Admin overview with platform statistics |
| `users` | User list and management |
| `listings` | Listing browsing and moderation |
| `categories` | Category CRUD operations |
| `transactions` | Transaction history and details |
| `disputes` | Dispute resolution workflow |
| `notifications` | Notification center |
| `audit-log` | Admin action audit trail |

---

## Shared Utilities

### Components

- **Layout** — Main app shell wrapping all authenticated pages
- **Sidebar** — Navigation menu with links to all feature sections

### Directives

| Directive | Description |
|---|---|
| `autoFocus` | Auto-focuses an element on render |
| `clickOutside` | Emits an event when a click occurs outside the host element |
| `hasRole` | Conditionally shows/hides elements based on the user's role |

### Pipes

| Pipe | Description |
|---|---|
| `creditFormat` | Formats credit amounts for display |
| `timeAgo` | Converts timestamps to relative time (e.g., "3 hours ago") |
| `truncate` | Truncates long strings with an ellipsis |

---

## Environment Configuration

Environment files are located in `src/environments/`:

| File | Used When |
|---|---|
| `environment.ts` | Production build (`ng build`) |
| `environment.development.ts` | Development server (`ng serve`) |

```ts
// src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

```ts
// src/environments/environment.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.badilni.com'
};
```

Angular's `fileReplacements` in `angular.json` swaps `environment.ts` with the correct file at build time based on the active configuration.

---

## License

This project is proprietary. All rights reserved © Badilni.
