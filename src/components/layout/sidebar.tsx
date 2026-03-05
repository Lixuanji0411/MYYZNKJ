import { NavLink, useLocation, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import {
  LayoutDashboard,
  Receipt,
  Calculator,
  Package,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  MessageSquareText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/logo'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { motion } from 'framer-motion'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '工作台', end: true },
  { path: '/ai-chat', icon: MessageSquareText, label: 'AI 助手', badge: 'AI' },
  { path: '/accounting', icon: Receipt, label: '智能记账' },
  { path: '/tax', icon: Calculator, label: '智能税务' },
  { path: '/inventory', icon: Package, label: '库存管理' },
  { path: '/reports', icon: BarChart3, label: '智能报表' },
]

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const location = useLocation()

  const userInitial = user?.name?.charAt(0) || 'U'

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
    >
      <div className="flex h-14 items-center px-4">
        <Logo size={collapsed ? 28 : 32} collapsed={collapsed} />
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.end
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path)

          const linkContent = (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-sidebar-primary')} strokeWidth={1.75} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </NavLink>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <div className="relative">{linkContent}</div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          }

          return <div key={item.path} className="relative">{linkContent}</div>
        })}
      </nav>

      <div className="space-y-2 px-3 pb-4">
        <Separator className="bg-sidebar-border" />

        <div className="flex items-center gap-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="h-9 w-9 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">切换主题</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full justify-start gap-3 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? '浅色模式' : '深色模式'}
            </Button>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Link to="/profile" className="shrink-0">
            <Avatar className="h-8 w-8 cursor-pointer transition-opacity hover:opacity-80">
              {user?.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
          </Link>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between">
              <Link to="/profile" className="min-w-0 hover:opacity-80 transition-opacity">
                <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                  {user?.name || '用户'}
                </p>
                <p className="truncate text-xs text-sidebar-muted">
                  {user?.businessType === 'individual' ? '个体工商户' : '小规模纳税人'}
                </p>
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logout()}
                    className="h-7 w-7 text-sidebar-muted hover:text-destructive hover:bg-sidebar-accent"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">退出登录</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="absolute -right-3 top-7 z-50 h-6 w-6 rounded-lg border border-sidebar-border bg-sidebar text-sidebar-muted shadow-sm hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </motion.aside>
  )
}
