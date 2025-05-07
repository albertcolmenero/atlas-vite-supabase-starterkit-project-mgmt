import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { SectionTitle } from '@/components/SectionTitle'
import { useLocation } from 'react-router-dom'

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // Map pathname to section name
  const sectionMap: Record<string, string> = {
    '/dashboard': '',
    '/projects': 'Projects',
    '/tasks': 'Tasks',
    '/custom-fields': 'Custom Fields',
    // Add more routes as needed
  };
  // Find the best match for the current path
  const sectionName = sectionMap[location.pathname] || '';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              
              {/* Section title after breadcrumb */}
              <SectionTitle title={sectionName} className="ml-0 hidden md:block" />
            </div>
            <div className="ml-auto px-3">
              {/* Add user menu or actions here if needed */}
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 px-4 py-0">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 