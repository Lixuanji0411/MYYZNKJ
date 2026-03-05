import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useNotificationStore } from '@/stores/notification.store'

const routeLabels: Record<string, string> = {
  '': '工作台',
  'accounting': '智能记账',
  'accounting/new': '新建记录',
  'accounting/reconciliation': '对账中心',
  'tax': '智能税务',
  'tax/declaration': '申报表',
  'tax/calendar': '申报日历',
  'inventory': '库存管理',
  'inventory/stock-in': '入库',
  'inventory/stock-out': '出库/销售',
  'reports': '智能报表',
  'reports/daily': '日结报表',
  'reports/monthly': '月结报表',
  'reports/tax-summary': '报税汇总',
  'ai-chat': 'AI 助手',
  'profile': '个人中心',
  'notifications': '消息通知',
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const pathSegments = location.pathname.split('/').filter(Boolean)

  const breadcrumbs = pathSegments.reduce<Array<{ label: string; path: string }>>((acc, segment, index) => {
    const fullPath = pathSegments.slice(0, index + 1).join('/')
    const label = routeLabels[fullPath] || segment
    acc.push({ label, path: `/${fullPath}` })
    return acc
  }, [])

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/accounting?search=${encodeURIComponent(searchValue.trim())}`)
      setSearchValue('')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur-sm">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">工作台</BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path} className="flex items-center gap-1.5">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.path}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索记录..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
            className="h-8 w-56 bg-muted/40 pl-8 text-sm"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}
