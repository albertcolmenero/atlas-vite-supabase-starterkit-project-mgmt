# Project Requirements Document

## 1. Project Overview

We’re building a “starter kit” or boilerplate that gets new web apps up and running in minutes. It uses Vite (for lightning-fast builds), TypeScript (for safe, maintainable code), Tailwind CSS + shadcn UI (for a modern, customizable design system), Clerk.com (for authentication), and Supabase (for your database). Out of the box you get a marketing landing page with lead-capture, Google-only social login via Clerk, a protected dashboard layout with sidebar navigation, plus a fully functional “Projects” management page backed by Supabase and seeded with example data.

This kit solves the common problem of spending days wiring up basics—auth, design system, DB, dev tooling—and lets AI-IDE builders dive straight into feature work. Success means a developer can clone the repo, add environment variables, run `npm install && npm dev`, and immediately see a polished landing page, sign in with Google, and interact with a real CRUD app. All code follows consistent linting/formatting rules, a clear file structure, and includes testing scaffolding.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (MVP)

- **Marketing Page**

  - Responsive top nav (logo, section links, Sign In)
  - Hero section (headline + image)
  - “Trusted by” logos
  - Key features overview
  - Join-the-waitlist form (name + email)

- **Authentication**

  - Clerk.com hosted pages
  - Google login only

- **Private User Area**

  - Collapsible sidebar (Dashboard, Projects, Profile)
  - Dashboard (“Welcome, [Name]”)
  - Projects page: Supabase-backed data table with search, pagination, sorting, inline delete, add form in right panel
  - Profile page: Clerk’s prebuilt components

- **Supabase**

  - Preconfigured database with a single `projects` table
  - Seed script with sample project entries

- **Development Tooling**

  - ESLint + Prettier configs
  - Testing setup (Vitest or Jest)
  - Vite dev server + build
  - `.env.example` for environment variables

- **Theming**

  - Tailwind config extended with a primary purple color
  - shadcn UI primitives for consistent spacing, typography, and components

### Out-of-Scope (Phase 2+)

- Additional social/third-party logins (GitHub, Facebook, etc.)
- Role-based permissions or admin vs. standard user flows
- Supabase edge functions or file storage
- Custom CI/CD pipeline or deployment scripts
- Analytics beyond basic form tracking
- Mobile-only views or native apps
- Payment integration or subscriptions

## 3. User Flow

When an unregistered visitor arrives, they land on the marketing page. A sticky top bar presents your logo, in-page links (Features, Trusted By, Join Waitlist) and a Sign In button. Scrolling reveals an eye-catching hero section (text + image), logos of trusted customers, a breakdown of core features, and finally a simple form to join the waitlist or subscribe. If they click Sign In or submit the waitlist form, we collect their email (for leads) or redirect them to Clerk’s hosted Google login page.

After successful Google authentication, Clerk redirects the user into the protected area. They see a collapsible sidebar on the left with links to Dashboard, Projects, and Profile. The Dashboard greets them: “Welcome, [User Name]” with room to add quick stats later. On the Projects page, they’re greeted by a live Supabase table seeded with sample data. They can search by project name, paginate, sort columns, click “Add New Project” to open a right panel form, or instantly delete rows inline. The Profile page uses Clerk’s components so the user can update their email, manage sessions, and sign out without any custom UI work.

## 4. Core Features

- **Responsive Marketing Page**\
  Tailwind + shadcn UI components for nav, hero, logos, features, and waitlist form.

- **Lead-Capture Form**\
  Simple name + email, wired for analytics tracking.

- **Clerk Authentication**\
  Hosted Sign In/Sign Up pages, Google social login, session management.

- **Protected Layout**\
  Collapsible sidebar with consistent purple-accented theme.

- **Dashboard**\
  Personalized welcome message; placeholder area for future metrics.

- **Projects Management**\
  Supabase table with:

  - Seed data
  - Search across project names
  - Pagination controls
  - Column sorting
  - “Add Project” form in right panel
  - Inline deletion

- **User Profile**\
  Clerk’s prebuilt UI for email updates, session management, sign out.

- **Supabase Configuration**\
  `projects` table schema, seed script; only database features enabled.

- **Development Tooling**\
  ESLint, Prettier, Vitest/Jest setup, Vite dev server, `.env.example`.

- **Theming**\
  Tailwind extended with primary purple; shadcn UI tokens for spacing & typography.

- **Clear Project Structure**\
  Public folder, `src/components/ui`, `hooks`, `lib`, main entry files, config files.

## 5. Tech Stack & Tools

- **Frontend:** Vite + React + TypeScript

- **Styling:** Tailwind CSS (+ custom purple palette) + shadcn UI primitives

- **Auth:** Clerk.com (Google login only)

- **Database:** Supabase (Postgres)

- **Dev Tools:**

  - ESLint (linting)
  - Prettier (formatting)
  - Vitest or Jest + Testing Library (unit/integration tests)
  - `.env.example` for env vars

- **AI-Assisted Coding:** Cursor IDE (real-time suggestions) + GPT-4o (code generation)

## 6. Non-Functional Requirements

- **Performance:**

  - Marketing page loads in <1 s on 3G+
  - Dashboard & Projects table actions (search, paginate) respond in <200 ms

- **Security:**

  - HTTPS only
  - Clerk token storage in HTTP-only cookies
  - Validate all form inputs

- **Compliance & Privacy:**

  - GDPR-compatible opt-in for lead form
  - Cookie banner for analytics (if enabled)

- **Usability & Accessibility:**

  - WCAG 2.1 AA contrast ratios
  - Keyboard-navigable sidebar and forms
  - Mobile-first responsive design

- **Maintainability:**

  - 90+ on Lighthouse audits
  - Well-documented code and folder structure

## 7. Constraints & Assumptions

- Developers must supply Clerk.com and Supabase accounts and keys.
- Google social login only; no fallback email/password.
- Node.js 16+ environment.
- No CI/CD choice yet—assume any platform supporting Vite (Vercel/Netlify/GitHub Actions).
- Real-time Supabase features (listeners) are not required in MVP.
- AI IDE (Cursor) + GPT-4o will assist coding, but final config lives in repo.

## 8. Known Issues & Potential Pitfalls

- **CORS & Redirects:**\
  Ensure Clerk redirect URLs and Supabase API URLs match environment settings.
- **Rate Limits:**\
  Clerk free tier and Supabase may throttle requests; batch DB calls sensibly.
- **Theming Conflicts:**\
  Overriding Tailwind defaults can break shadcn UI tokens—document theme steps clearly.
- **Form Validation:**\
  Client-side only in MVP; consider adding server-side checks if lead form sees spam.
- **Seed Script Idempotency:**\
  Make sure rerunning `npm run seed` doesn’t duplicate records—use upsert logic.

Mitigation tips and configuration snippets should live in a `docs/` directory so future teams can tweak auth providers, add edge functions, or swap deployment targets without confusion.
