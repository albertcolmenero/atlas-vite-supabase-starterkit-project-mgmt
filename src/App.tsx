import MarketingPage from './pages/index'
import ProjectsPage from './pages/projects'
import SignInPage from './pages/sign-in'
import ProfilePage from './pages/profile'
import PrivateLayout from './layouts/PrivateLayout'
import DashboardPage from './pages/dashboard'
import TasksPage from './pages/tasks'
import CustomFieldsPage from './pages/custom-fields'
import PricingPage from './pages/pricing'
import SettingsPage from './pages/settings'
import { ProjectDashboardPage } from '@/pages/ProjectDashboardPage'
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { useUser, UserButton, useClerk, SignedIn, SignedOut } from '@clerk/clerk-react'
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu'

function NavBar() {
  const { user } = useUser()
  const clerk = useClerk()
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur border-b border-primary/10 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-primary">
          Atlas Starter Kit
        </Link>
        
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <UserButton afterSignOutUrl="/" />
              <button
                className="hidden md:inline-block text-sm px-4 py-2 rounded-md bg-primary text-white font-semibold shadow hover:bg-primary/90 transition"
                onClick={async () => { await clerk.signOut(); navigate('/') }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/sign-in"
              className="text-sm px-4 py-2 rounded-md bg-primary text-white font-semibold shadow hover:bg-primary/90 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><NavBar /><MarketingPage /></>} />
        <Route path="/sign-in" element={<><NavBar /><SignInPage /></>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PrivateLayout>
                <DashboardPage />
              </PrivateLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <PrivateLayout>
                <ProjectsPage />
              </PrivateLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/dashboard"
          element={
            <ProtectedRoute>
              <PrivateLayout>
                <ProjectDashboardPage />
              </PrivateLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PrivateLayout>
                <ProfilePage />
              </PrivateLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <PrivateLayout>
                <TasksPage />
              </PrivateLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/custom-fields"
          element={
            <ProtectedRoute>
              <PrivateLayout>
                <CustomFieldsPage />
              </PrivateLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <PrivateLayout>
              <PricingPage />
            </PrivateLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <PrivateLayout>
                <SettingsPage />
              </PrivateLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/sign-in/sso-callback" element={<SignInPage />} />
      </Routes>
    </BrowserRouter>
  )
}
