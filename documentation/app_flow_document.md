# App Flow Document

## Onboarding and Sign-In/Sign-Up

When a new visitor arrives at the application, they land on a public marketing page accessible via the root URL or a shared link. This page features a top navigation bar displaying the brand logo, links to each section of the page, and a prominent Sign In button. Visitors can scroll through a hero section with headline text and an illustrative image, view trusted partner logos, read a concise overview of key features, and fill out a waitlist or newsletter form that captures name and email for lead tracking. Analytics tracking scripts record form submissions and page interactions behind the scenes.

When the visitor clicks the Sign In button, the application redirects to Clerk’s hosted authentication page. Only Google social login is enabled, so the user selects Google, consents to share their account details, and Clerk handles session creation. Upon successful authentication, Clerk returns the user to the application’s private area. Signing out is handled through a Sign Out link in the private layout, which clears the session and returns the user to the marketing page. Since Google login is the sole method, there is no password recovery flow within the app.

## Main Dashboard or Home Page

After signing in, the user lands on the Dashboard, which serves as the application’s home page for authenticated users. The layout features a collapsible sidebar on the left, built with Shadcn UI primitives, that contains links to Dashboard, Projects, and Profile pages. A header bar shows the user’s name and a Sign Out link. The Dashboard itself welcomes the user with a personal greeting at the top, such as “Welcome, [User Name],” and reserves space for future metrics or quick links in the main content area. The purple-accented theme is applied consistently across the header, sidebar, and main content areas to reinforce branding.

## Detailed Feature Flows and Page Transitions

When the user selects Projects from the sidebar, the application navigates to the Projects page. This page displays a dynamic data table powered by Supabase, pre-populated with seed data from the projects table. The table supports real-time searching by project name, pagination controls at the bottom, and clickable column headers for sorting in ascending or descending order. A button labeled Add New Project in the header of the table triggers a right-side sliding panel containing a form for creating a new project entry. The user fills in fields such as project name and description, submits the form, and sees the new row appear instantly in the table as Supabase updates the database. Each row features an inline delete icon that prompts the user to confirm removal; upon confirmation, the project is removed from the database and the table updates automatically.

When the user clicks Profile in the sidebar, the app transitions to the Profile page, which embeds Clerk’s prebuilt UI components. These components allow the user to view and update their email, manage active sessions across devices, and sign out. This page uses the same sidebar and header layout, making transitions smooth and consistent.

## Settings and Account Management

All account settings are managed on the Profile page powered by Clerk components. The user can change their primary email address and see a list of active sessions with options to revoke individual sessions. Notification preferences and other custom settings are not present in the initial version but could be added alongside Clerk’s components in future iterations. Billing or subscription pages are not included at this stage. After making any changes, the user remains in the private layout and can click the Dashboard link in the sidebar to return to the main home page.

## Error States and Alternate Paths

If the user loses internet connectivity or if Supabase fails to respond, the application displays a banner at the top of the content area indicating an error, such as “Unable to connect. Please check your connection and try again.” For authentication failures or if the Google consent is revoked, Clerk redirects the user back to the sign-in page with an error message explaining the issue. When form validation fails in the Add New Project panel—such as missing required fields—the form highlights the invalid inputs and displays messages prompting the user to correct entries. In all error states, the user can retry the previous action or navigate to another section using the sidebar or header links.

## Conclusion and Overall App Journey

A visitor begins by exploring the marketing page, reading about the product, and optionally joining the waitlist. Clicking Sign In takes them into Clerk’s Google login flow, and upon successful sign-in they arrive at a private dashboard that greets them by name. From the dashboard, they navigate to Projects, where they view, search, sort, add, and delete project entries in real time, thanks to Supabase. The Profile page powered by Clerk lets them manage their account and sign out. Throughout the experience, the consistently themed sidebar and header guide the user seamlessly between pages, while error banners and form validation ensure they can recover from any issues and complete their goals with confidence.
