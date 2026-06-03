import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/sidebar"
import { BusinessSwitcher } from "@/components/sidebar/business-switcher"
import { BusinessProvider } from "@/context/business-context"
import { CurrencyProvider } from "@/context/currency-context"
import { CurrencySelect } from "@/components/ui/currency/currency-select"
import { ExchangeRateBadge } from "@/components/ui/currency/exchange-rate-badge"
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <BusinessProvider>
      <CurrencyProvider>
      <AppSidebar />
      <main className="bg-background flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
        <nav className="flex items-center gap-2 p-4">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-center px-2">
            <BusinessSwitcher />
          </div>
          <div className="flex items-center gap-2">
            <ExchangeRateBadge />
            <CurrencySelect global />
          </div>
        </nav>
        {children}
      </main>
      </CurrencyProvider>
      </BusinessProvider>
    </SidebarProvider>
  )
}