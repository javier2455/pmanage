import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/sidebar"
import { BusinessSwitcher } from "@/components/sidebar/business-switcher"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { BusinessProvider } from "@/context/business-context"
import { AccessGuard } from "@/components/auth/access-guard"
import { RouteGuard } from "@/components/auth/route-guard"
import { ReactivationGuard } from "@/components/auth/reactivation-guard"
import { PlanGuard } from "@/components/auth/plan-guard"
import { TourProvider } from "@/components/tour/tour-provider"
import { TourHelpButton } from "@/components/tour/tour-help-button"
import { ConnectivityIndicator } from "@/components/connectivity/connectivity-indicator"
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ReactivationGuard>
      <PlanGuard>
      <SidebarProvider>
        <BusinessProvider>
        {/* El tour envuelve también al sidebar: necesita resaltar sus items y
            el menú de usuario llama a `useTour`. Va fuera de los guards para
            sobrevivir a sus redirecciones y poder cerrarse limpio. */}
        <TourProvider>
        <AppSidebar />
        <main className="bg-background flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden p-4">
          <nav className="flex items-center gap-2 p-4">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-center px-2" data-tour="business-switcher">
              <BusinessSwitcher />
            </div>
            <ConnectivityIndicator />
            <TourHelpButton />
            <NotificationBell />
          </nav>
          <RouteGuard>
            <AccessGuard>{children}</AccessGuard>
          </RouteGuard>
        </main>
        </TourProvider>
        </BusinessProvider>
      </SidebarProvider>
      </PlanGuard>
    </ReactivationGuard>
  )
}