# Atlas Vite + Supabase Project Management Starter Kit

A modern project management application built with Vite, React, and Supabase, designed to showcase integration with the Atlas SDK. This project demonstrates "vibe coding" techniques for creating responsive, feature-rich applications that can be enhanced with Atlas's capabilities.

![Project Preview](https://github.com/RunOnAtlas/atlas-vite-supabase-starterkit-project-mgmt/raw/main/public/codeguide-backdrop.svg)

## About This Project

This starter kit was created to demonstrate a smooth integration path for the Atlas SDK. The project includes:

- A complete project management system with dashboards, tasks, and custom fields
- Role-based user collaboration features
- Data visualization using charts and metrics
- Robust authentication using Clerk.com

The codebase showcases clean architecture principles and "vibe coding" techniques, which prioritize developer experience, maintainability, and scalable patterns.

## Tech Stack

- **Frontend:** Vite + React + TypeScript
- **UI Components:** Tailwind CSS + shadcn/ui
- **Authentication:** Clerk.com (Google login)
- **Database & Backend:** Supabase (PostgreSQL)
- **Data Visualization:** Recharts
- **State Management:** React Query + Context API
- **Forms:** React Hook Form + Zod

## Features

### Core Functionality
- **Project & Task Management:** Create, update, and organize projects and tasks
- **Custom Fields:** Add custom fields to projects and tasks based on your workflow
- **Project Dashboards:** View project-specific metrics and visualizations
- **Global Dashboard:** Track activity across all your projects

### Integration Showcase
This project was built to demonstrate how Atlas SDK can be integrated to enhance:

- **Runtime Permissions:** Control data access with fine-grained entitlements
- **Usage Limits:** Apply limits to projects, tasks, and storage
- **Analytics Integration:** Connect in-app activities to Atlas's analytics capabilities
- **Monetization:** Pre-built structure for premium features and upgrade paths

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/RunOnAtlas/atlas-vite-supabase-starterkit-project-mgmt.git
   cd atlas-vite-supabase-starterkit-project-mgmt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Set up your Supabase and Clerk credentials

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Set up the database**
   - The SQL scripts in `src/lib/sql/` can be executed in your Supabase SQL editor
   - These create the tables, functions, and seed data needed

## Atlas SDK Integration Points

While this starter kit doesn't currently include the Atlas SDK, it's structured to showcase where integration would make sense:

### User Permissions & Entitlements
- `src/hooks/useProjects.ts` - Add Atlas SDK checks to limit project access
- `src/pages/projects/columns.tsx` - Conditionally render actions based on entitlements
- `src/components/custom-fields/CustomFieldsManager.tsx` - Gate premium features

### Usage Tracking & Analytics
- `src/lib/supabaseClient.ts` - Track API usage and limits
- `src/pages/dashboard.tsx` - Integrate Atlas events for activity metrics
- `src/pages/projects/project-dashboard.tsx` - Connect project metrics to Atlas

### Monetization Points
- `src/pages/pricing.tsx` - Connect to Atlas's subscription management
- `src/components/premium/UpgradeButton.tsx` - Trigger Atlas-managed upgrade flows
- `src/components/premium/PremiumBadge.tsx` - Feature gating based on subscription level

## Documentation

This project includes comprehensive documentation to help you understand the codebase and integration points:

- **Project Requirements:** `documentation/project_requirements_document.md`
- **App Flow:** `documentation/app_flow_document.md`
- **Backend Structure:** `documentation/backend_structure_document.md`
- **Frontend Guidelines:** `documentation/frontend_guidelines_document.md`

## Future Developments

In upcoming versions, we plan to:

1. Add direct Atlas SDK integration examples
2. Showcase Atlas authentication modes
3. Demonstrate limit enforcement using Atlas entitlements
4. Add collaboration features with Atlas permissioning

## License

[MIT](LICENSE)
