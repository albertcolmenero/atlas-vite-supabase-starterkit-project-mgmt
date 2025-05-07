import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Home, Folder, User, Sparkles, CheckSquare, Settings, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { useUser } from '@clerk/clerk-react'
import { NavUser } from './NavUser'
import { Command } from 'lucide-react'
export function AppSidebar() {
  const { user } = useUser();
  return (
    <Sidebar collapsible="icon" className="bg-gradient-to-b from-primary/5 to-white border-r border-primary/10 shadow-xl">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Vite + Supabase</span>
                  <span className="truncate text-xs">Starter Kit</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition">
                    <Home className="w-5 h-5 text-primary" />
                    <span className="font-medium group-data-[collapsible=icon]:hidden">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/projects" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition">
                    <Folder className="w-5 h-5 text-primary" />
                    <span className="font-medium group-data-[collapsible=icon]:hidden">Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/tasks" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    <span className="font-medium group-data-[collapsible=icon]:hidden">Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/custom-fields" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition">
                    <Settings className="w-5 h-5 text-primary" />
                    <span className="font-medium group-data-[collapsible=icon]:hidden">Custom Fields</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-8">
          
          <SidebarGroupContent>
            
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex items-center justify-center h-24  mt-4">
      <SidebarMenu>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/pricing" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span className="font-medium group-data-[collapsible=icon]:hidden">Upgrade to Premium</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
        {user ? (
          <NavUser
            user={{
              name: user.fullName || user.firstName || user.username || 'User',
              email: user.emailAddresses?.[0]?.emailAddress || '',
              avatar: user.imageUrl || '',
            }}
          />
        ) : (
          <UserButton afterSignOutUrl="/" />
        )}
      </SidebarFooter>
    </Sidebar>
  )
} 