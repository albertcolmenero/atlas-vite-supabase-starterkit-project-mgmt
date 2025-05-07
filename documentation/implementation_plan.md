# Implementation plan

## Phase 1: Environment Setup

1. Prevalidation: Check if the current directory contains a `package.json` or `.git` folder; if so, abort initializing a new project (**Project Summary: Development Tooling**).
2. Install Node.js v20.2.1 if not already installed (**Project Summary: Tech Stack**).
   - **Validation**: Run `node -v` to confirm it reports `v20.2.1`.
3. Initialize a new Git repository if none exists:
   ```bash
   git init
   ```
   (**Project Summary: Development Tooling**).
4. Create a `cursor_metrics.md` file in the project root and add a comment to refer to `cursor_project_rules.mdc` for usage (**Tools: Cursor**).
5. Create a `.cursor` directory in the project root if it doesn't exist (**Tools: Cursor**).
6. Create `.cursor/mcp.json` with placeholder content and ensure it exists (**Tools: Cursor**).
7. Add `.cursor/mcp.json` to `.gitignore` (**Tools: Cursor**).
8. Edit `.cursor/mcp.json` to include the following configuration (replace `<connection-string>` later):
   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": [
           "-y",
           "@modelcontextprotocol/server-postgres",
           "<connection-string>"
         ]
       }
     }
   }
   ```
   (**Tools: Cursor**).
9. Display link for obtaining a Supabase MCP connection string:
   https://supabase.com/docs/guides/getting-started/mcp#connect-to-supabase-using-mcp (**Tools: Cursor**).
10. Prompt the user to replace `<connection-string>` in `.cursor/mcp.json` once they retrieve it from the link above (**Tools: Cursor**).
11. **Validation**: Open `.cursor/mcp.json` and confirm the connection string is correctly set (**Tools: Cursor**).

## Phase 2: Frontend Development

12. Initialize Vite React+TypeScript project in the current directory:
    ```bash
    npm create vite@latest . -- --template react-ts
    ```
    (**Project Summary: Tech Stack**).
13. **Validation**: Verify `package.json` lists React and TypeScript dependencies (**Project Summary: Tech Stack**).
14. Install Tailwind CSS and peer tools:
    ```bash
    npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
    ```
    (**Project Summary: Tech Stack**).
15. Generate Tailwind config files:
    ```bash
    npx tailwindcss init -p
    ```
    (**Project Summary: Tech Stack**).
16. In `tailwind.config.ts`, set content paths and extend the theme's primary color to purple:
    ```ts
    export default {
      content: ['./index.html', './src/**/*.{ts,tsx}'],
      theme: {
        extend: {
          colors: { primary: '#7C3AED' },
        },
      },
    }
    ```
    (**Project Summary: UI/Theming**).
17. In `src/index.css`, add Tailwind's directives:
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    ```
    (**Project Summary: Tech Stack**).
18. Install Shadcn UI and initialize:
    ```bash
    npm install @shadcn/ui
    npx shadcn-ui init
    ```
    (**Project Summary: Core Features**).
19. **Validation**: Ensure `.shadcn` or `shadcn.config.json` is created in the project root (**Project Summary: Core Features**).
20. Install Clerk for React:
    ```bash
    npm install @clerk/clerk-react
    ```
    (**Project Summary: Authentication**).
21. In `/src/main.tsx`, wrap your app in `ClerkProvider`:
    ```tsx
    import { ClerkProvider } from '@clerk/clerk-react'
    // …
    ;<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
    ```
    (**Project Summary: Authentication**).
22. Create a `.env` file in project root and add:
    ```env
    VITE_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
    ```
    (**Project Summary: Authentication**).
23. **Validation**: Run `npm run dev` and confirm Clerk's sign-in widget can be triggered (**Project Summary: Authentication**).

## Phase 3: Development Tooling & Tests

24. Install ESLint, Prettier, and related plugins:
    ```bash
    npm install -D eslint prettier eslint-config-prettier eslint-plugin-react
    ```
    (**Project Summary: Development Tooling**).
25. Add `.eslintrc.cjs` and `.prettierrc` files with recommended settings (**Project Summary: Development Tooling**).
26. **Validation**: Run `npx eslint . --ext .ts,.tsx` and `npx prettier --check .` to confirm zero errors (**Project Summary: Development Tooling**).
27. Install Vitest and testing utilities:
    ```bash
    npm install -D vitest jsdom @testing-library/react
    ```
    (**Project Summary: Development Tooling**).
28. Create `vitest.config.ts` with React support (**Project Summary: Development Tooling**).
29. **Validation**: Add a sample test in `/src/__tests__/sample.test.tsx` and run `npx vitest run` to ensure tests pass (**Project Summary: Development Tooling**).

## Phase 4: Supabase Schema & Seed Data

30. Create `supabase/schema.sql` with the `projects` table schema:
    ```sql
    create table projects (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      description text,
      created_at timestamp with time zone default now(),
      user_id uuid not null
    );
    ```
    (**Project Summary: Database**).
31. **Validation**: Open `supabase/schema.sql` and verify column definitions (**Project Summary: Database**).
32. Run MCP to apply schema:
    ```bash
    npx @modelcontextprotocol/server-postgres
    ```
    (**Project Summary: Database**).
33. **Validation**: Go to Supabase dashboard and confirm `projects` table exists (**Project Summary: Database**).
34. Create `supabase/seed.sql` with initial rows:
    ```sql
    insert into projects (name, description, user_id) values
      ('Demo Project','This is a demo', '<example-uuid>');
    ```
    (**Project Summary: Database**).
35. Run MCP to apply seed:
    ```bash
    npx @modelcontextprotocol/server-postgres --file supabase/seed.sql
    ```
    (**Project Summary: Database**).
36. **Validation**: Run `select * from projects;` in Supabase SQL editor to confirm seed data (**Project Summary: Database**).
37. Install Supabase JS client:
    ```bash
    npm install @supabase/supabase-js
    ```
    (**Project Summary: Database**).
38. Create `/src/lib/supabaseClient.ts`:
    ```ts
    import { createClient } from '@supabase/supabase-js'
    export const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
    ```
    (**Project Summary: Database**).
39. Add to `.env`:
    ```env
    VITE_SUPABASE_URL=<your-supabase-url>
    VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
    ```
    (**Project Summary: Database**).
40. **Validation**: In a quick TS file, import `supabase` and run `await supabase.from('projects').select('*')` to confirm a response (**Project Summary: Database**).

## Phase 5: UI Components & Pages

41. Create `/src/components/Header.tsx` using Shadcn UI with logo, menu links, and "Sign In" pointing to Clerk (Project Summary: Core Features).
42. Create `/src/components/Hero.tsx` with a headline, subtext, and illustrative image (Project Summary: Core Features).
43. Create `/src/components/TrustedBy.tsx` to display logos of trusted partners (Project Summary: Core Features).
44. Create `/src/components/FeaturesOverview.tsx` with feature cards describing kit capabilities (Project Summary: Core Features).
45. Create `/src/components/JoinWaitlistForm.tsx` with an email input and submit handler (Project Summary: Core Features).
46. Assemble the Marketing page in `/src/pages/index.tsx` by importing and arranging the above components (Project Summary: Core Features).
47. **Validation**: Run `npm run dev`, visit `/`, and confirm all sections render with Tailwind styling (Project Summary: Core Features).

## Phase 6: Private Area & CRUD Integration

48. Create `/src/components/ProtectedRoute.tsx` to redirect unauthenticated users to Clerk's sign-in (**Project Summary: Authentication**).
49. Create `/src/components/Sidebar.tsx` with Shadcn UI navigation links: Dashboard, Projects, Profile (**Project Summary: UI/Theming**).
50. Create `/src/layouts/PrivateLayout.tsx` to wrap private pages with `<Sidebar>` and `<ProtectedRoute>` (**Project Summary: App Flow**).
51. Create `/src/pages/dashboard.tsx`, fetch `user.firstName` from Clerk, and display "Welcome, [User Name]" (**Project Summary: App Flow**).
52. Create `/src/pages/projects.tsx`:
    - Fetch `projects` via `supabase.from('projects')`.
    - Render a data table (Shadcn UI) with search, pagination, sorting.
    - Add a Shadcn UI right-side panel form to insert a new project.
    - Add inline delete buttons that call `supabase.from('projects').delete()` (**Project Summary: Core Features**).
53. Create `/src/pages/profile.tsx` and include Clerk's `<UserButton>` and `<UserProfile>` components (**Project Summary: App Flow**).
54. **Validation**: Log in with Clerk Google, navigate to `/projects`, and confirm full CRUD functionality in the UI (**Project Summary: Core Features**).

## Phase 7: Deployment

55. Commit all changes and push to a new GitHub repository (`git remote add origin ... && git push -u origin main`) (**Project Summary: Deployment**).
56. In Vercel, import the GitHub repo and set up a project (**Project Summary: Deployment**).
57. In Vercel project settings, add environment variables:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `VITE_CLERK_PUBLISHABLE_KEY`
    - `CLERK_SECRET_KEY`
      (**Project Summary: Deployment**).
58. Trigger a Vercel deployment and monitor build logs (**Project Summary: Deployment**).
59. **Validation**: Visit the Vercel URL, confirm marketing and private pages load correctly over HTTPS (**Project Summary: Deployment**).

## Phase 8: Edge Cases & Non-Functional Requirements

60. Create `/src/components/Spinner.tsx` using Shadcn UI for loading states; integrate in data-fetching components (**Project Summary: Non-Functional Requirements**).
61. Add a global error boundary in `/src/ErrorBoundary.tsx` to catch runtime errors and display a fallback UI (**Project Summary: Non-Functional Requirements**).
62. Create `404.tsx` in `/src/pages` with a "Return Home" button linking back to `/` (**Project Summary: Non-Functional Requirements**).
63. Ensure WCAG 2.1 AA compliance by adding ARIA labels to forms and navigation links (**Project Summary: Non-Functional Requirements**).
64. Run a Lighthouse audit in Chrome DevTools and record performance, accessibility, and best-practices scores in `cursor_metrics.md` (**Project Summary: Non-Functional Requirements**).
65. **Validation**: Confirm Lighthouse scores meet or exceed 90 for performance and accessibility (**Project Summary: Non-Functional Requirements**).

## Planned: Multi-User (Account/Team) Support

To enable more than one user per account (team/organization), follow this plan:

### 1. Define the Data Model
- **Accounts Table**: Create an `accounts` (or `organizations`, `teams`) table in Supabase.
  - Fields: `id`, `name`, `created_at`, etc.
- **Account Memberships Table**: Create a join table (e.g., `account_members`) to link users to accounts.
  - Fields: `id`, `account_id`, `user_id`, `role` (optional: `owner`, `admin`, `member`), `created_at`.
- **Update Projects Table**: Add an `account_id` foreign key to the `projects` table, so projects belong to an account, not just a user.

### 2. Update Row-Level Security (RLS) Policies
- Ensure users can only access accounts and projects where they are members.
- Update RLS on `projects` and new tables to check membership.

### 3. Backend/Database Migration
- Write SQL migrations to create the new tables and update existing ones.
- Migrate existing projects to be associated with an account (e.g., create a default account per user).

### 4. Frontend Changes
- **Account Switcher UI**: Add a way for users to switch between accounts (e.g., dropdown in the sidebar/header).
- **Invite/Manage Members**: Add UI to invite users (by email), list members, and manage roles.
- **Project Scoping**: When fetching/creating projects, always scope by the selected account.

### 5. Invitations & Onboarding
- Implement an invitation flow:
  - User enters an email to invite.
  - Invited user receives a link, signs up (if needed), and is added to the account.
- Optionally, allow users to create new accounts/teams and invite others.

### 6. Permissions & Roles (Optional)
- Define roles (owner, admin, member) and permissions for each.
- Enforce permissions in the UI and RLS policies.

### 7. Testing & QA
- Test with multiple users/accounts.
- Ensure users cannot access data from accounts they don't belong to.

### 8. Documentation & Migration
- Document the new data model and flows.
- Provide a migration path for existing users/projects.

**Summary Table:**

| Step                | Description                                      |
|---------------------|--------------------------------------------------|
| Data Model          | Add `accounts` and `account_members` tables      |
| RLS                 | Update policies for multi-user access            |
| Migration           | SQL scripts to create/update tables              |
| Frontend            | Account switcher, invite/manage members UI       |
| Invitations         | Email invite flow for new members                |
| Roles (Optional)    | Owner/admin/member roles and permissions         |
| Testing             | Multi-user, multi-account scenarios              |
| Docs/Migration      | Update docs and migrate existing data            |
