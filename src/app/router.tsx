import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const AppLayout = lazy(() => import('@/components/layout/app-layout'))
const AuthLayout = lazy(() => import('@/components/layout/auth-layout'))

const LoginPage = lazy(() => import('@/pages/auth/login'))
const RegisterPage = lazy(() => import('@/pages/auth/register'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const AccountingPage = lazy(() => import('@/pages/accounting'))
const NewRecordPage = lazy(() => import('@/pages/accounting/new-record'))
const ReconciliationPage = lazy(() => import('@/pages/accounting/reconciliation'))
const TaxPage = lazy(() => import('@/pages/tax'))
const DeclarationPage = lazy(() => import('@/pages/tax/declaration'))
const TaxCalendarPage = lazy(() => import('@/pages/tax/calendar'))
const InventoryPage = lazy(() => import('@/pages/inventory'))
const ProductDetailPage = lazy(() => import('@/pages/inventory/product-detail'))
const StockInPage = lazy(() => import('@/pages/inventory/stock-in'))
const StockOutPage = lazy(() => import('@/pages/inventory/stock-out'))
const ReportsPage = lazy(() => import('@/pages/reports'))
const DailyReportPage = lazy(() => import('@/pages/reports/daily'))
const MonthlyReportPage = lazy(() => import('@/pages/reports/monthly'))
const TaxSummaryPage = lazy(() => import('@/pages/reports/tax-summary'))
const AiChatPage = lazy(() => import('@/pages/ai-chat'))
const ProfilePage = lazy(() => import('@/pages/profile'))
const NotificationsPage = lazy(() => import('@/pages/notifications'))

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    </div>
  )
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <SuspenseWrapper>
        <AppLayout />
      </SuspenseWrapper>
    ),
    children: [
      { index: true, element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
      { path: 'accounting', element: <SuspenseWrapper><AccountingPage /></SuspenseWrapper> },
      { path: 'accounting/new', element: <SuspenseWrapper><NewRecordPage /></SuspenseWrapper> },
      { path: 'accounting/reconciliation', element: <SuspenseWrapper><ReconciliationPage /></SuspenseWrapper> },
      { path: 'tax', element: <SuspenseWrapper><TaxPage /></SuspenseWrapper> },
      { path: 'tax/declaration', element: <SuspenseWrapper><DeclarationPage /></SuspenseWrapper> },
      { path: 'tax/calendar', element: <SuspenseWrapper><TaxCalendarPage /></SuspenseWrapper> },
      { path: 'inventory', element: <SuspenseWrapper><InventoryPage /></SuspenseWrapper> },
      { path: 'inventory/:id', element: <SuspenseWrapper><ProductDetailPage /></SuspenseWrapper> },
      { path: 'inventory/stock-in', element: <SuspenseWrapper><StockInPage /></SuspenseWrapper> },
      { path: 'inventory/stock-out', element: <SuspenseWrapper><StockOutPage /></SuspenseWrapper> },
      { path: 'reports', element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper> },
      { path: 'reports/daily', element: <SuspenseWrapper><DailyReportPage /></SuspenseWrapper> },
      { path: 'reports/monthly', element: <SuspenseWrapper><MonthlyReportPage /></SuspenseWrapper> },
      { path: 'reports/tax-summary', element: <SuspenseWrapper><TaxSummaryPage /></SuspenseWrapper> },
      { path: 'ai-chat', element: <SuspenseWrapper><AiChatPage /></SuspenseWrapper> },
      { path: 'profile', element: <SuspenseWrapper><ProfilePage /></SuspenseWrapper> },
      { path: 'notifications', element: <SuspenseWrapper><NotificationsPage /></SuspenseWrapper> },
    ],
  },
  {
    element: (
      <SuspenseWrapper>
        <AuthLayout />
      </SuspenseWrapper>
    ),
    children: [
      { path: 'login', element: <SuspenseWrapper><LoginPage /></SuspenseWrapper> },
      { path: 'register', element: <SuspenseWrapper><RegisterPage /></SuspenseWrapper> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
