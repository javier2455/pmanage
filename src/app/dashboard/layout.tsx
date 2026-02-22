import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/sidebar"
import { BusinessSwitcher } from "@/components/sidebar/business-switcher"
import { BusinessProvider } from "@/context/business-context"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <BusinessProvider>
      <AppSidebar />
      <main className="bg-background w-full min-h-screen">
        <nav className="flex items-center gap-2 p-4">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-center px-2">
            <BusinessSwitcher />
          </div>
        </nav>
        {children}
      </main>
      </BusinessProvider>
    </SidebarProvider>
  )
}