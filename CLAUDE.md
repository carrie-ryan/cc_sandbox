# Project Overview
Customer Connect is a zero-trust network access dashboard built with Angular 21 and Tailwind CSS.
It has three distinct user personas:

**Provider** (unnamed) — manages multiple customer accounts from a top-level dashboard.
Routes: `/dashboard`, `/customers/:id`, `/provider-setup/*`

**Ian** — customer network admin who monitors connectors, alerts, audit logs, and access control.
**Maya** — customer end user who manages her own devices, apps, and connection settings.
Ian and Maya share `/customer-dashboard`, with the view toggled by `PersonaService.activePersona()`.

See @README.md for full context.

## Commands
- `npm start` — start dev server (http://localhost:4200)
- `npm run build` — production build
- `npm test` — run tests via Vitest
- `npm run watch` — build in watch mode
- `npx prettier --write .` — format all files

## Architecture
- `src/app/` — components, services, routing
- Angular 21 standalone components throughout — never use NgModules
- All app data is hardcoded in `CustomerService` — there is no HTTP layer or API
- Services are synchronous — do not use observables, `HttpClient`, or async data patterns
- Services injected via constructor with `private` or `public` visibility as appropriate
- Use `host` property on `@Component` for layout/container classes

## Routes
- `/login` — LoginComponent
- `/dashboard` — ProviderDashboardComponent (provider view)
- `/customers/:id` — CustomerDetailComponent
- `/customer-dashboard` — CustomerDashboardComponent (Ian/Maya persona dashboard)
- `/maya-setup` — MayaSetupComponent
- `/provider-setup/overview` — OverviewPageComponent
- `/provider-setup/connector-templates` — ConnectorTemplatesComponent
- `/provider-setup/locations` — LocationsComponent
- `/customer-portal/locations` — CustomerLocationsComponent
- `/customer-portal/onboarding` — CustomerOnboardingComponent
- `/customer-setup/profile` — CustomerSetupProfileComponent (default for /customer-setup)
- `/customer-setup/locations` — CustomerSetupLocationsComponent
- `/customer-setup/invite` — CustomerSetupInviteUsersComponent

## Key Services
**PersonaService** — manages global UI state via signals:
- `activePersona()` — `'ian'` | `'maya'`
- `darkMode()` / `toggleDarkMode()` — persisted to localStorage
- `showSettings` — signal controlling settings modal visibility

**CustomerService** — provides hardcoded customer data:
- `getAll()` — returns all `Customer[]`
- `getById(id)` — returns a single `Customer | undefined`
- Key interfaces: `Customer`, `CustomerIdentity`, `CustomerConnector`, `CustomerLocation`, `Alert`, `BoundService`

## Angular Patterns
- Use `@if`, `@for`, `@else` control flow — never `*ngIf` or `*ngFor`
- Use Angular signals for reactive state (`signal()`, `.set()`, `.update()`, `()` to read)
- Conditional classes use `[class.tailwind-class]="condition"` binding syntax
- Use `ng-template` with `NgTemplateOutlet` for repeated template fragments
- No component library — all UI is hand-built with Tailwind

## Styling
- All styling via Tailwind utility classes — no component-scoped CSS
- Dark mode is required on all UI — every element needs `dark:` variants alongside light styles
- Icons are inline SVG (Heroicons style) — no icon library installed, do not suggest one
- Prettier handles formatting — run `npx prettier --write .` before committing

## Accessibility
Follow WCAG 2.2 AA for all UI work:
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.) over `<div>` with click handlers
- Add `aria-label` on interactive elements without visible text
- Don't suppress Tailwind focus styles — use `focus-visible:` if customising
- Use `sr-only` for screen-reader-only text
- Ensure all interactive elements are keyboard navigable

## Gotchas
- Always use standalone components — never generate NgModule-based code
- `@angular/animations` is not installed — do not use animation APIs
- Dark mode variants are mandatory — never add light styles without a `dark:` counterpart
- Do not suggest installing an icon library — use inline SVG
- Do not generate HTTP calls or observables — all data comes from CustomerService synchronously
- `localStorage` is accessed directly (no abstraction layer)