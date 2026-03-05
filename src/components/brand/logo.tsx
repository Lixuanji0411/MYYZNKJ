import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  collapsed?: boolean
  className?: string
}

export function Logo({ size = 32, collapsed = false, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* 外层圆角方框 - 印章底座 */}
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="14"
          fill="url(#logo-bg)"
          stroke="url(#logo-border)"
          strokeWidth="1.5"
        />

        {/* 内层装饰边框 */}
        <rect
          x="6"
          y="6"
          width="52"
          height="52"
          rx="10"
          fill="none"
          stroke="hsl(30 20% 96%)"
          strokeWidth="0.5"
          opacity="0.3"
        />

        {/* 算盘横梁 - 上 */}
        <line x1="16" y1="18" x2="48" y2="18" stroke="hsl(36 72% 70%)" strokeWidth="1.5" strokeLinecap="round" />
        {/* 算盘横梁 - 中 */}
        <line x1="16" y1="28" x2="48" y2="28" stroke="hsl(36 72% 65%)" strokeWidth="1" strokeLinecap="round" />

        {/* 算盘珠子 - 第1列 */}
        <circle cx="22" cy="18" r="3" fill="hsl(36 72% 75%)" />
        <circle cx="22" cy="24" r="2.5" fill="hsl(30 25% 96%)" fillOpacity="0.9" />

        {/* 算盘珠子 - 第2列 */}
        <circle cx="32" cy="18" r="3" fill="hsl(36 72% 70%)" />
        <circle cx="32" cy="23" r="2.5" fill="hsl(30 25% 96%)" fillOpacity="0.85" />

        {/* 算盘珠子 - 第3列 */}
        <circle cx="42" cy="18" r="3" fill="hsl(36 72% 65%)" />
        <circle cx="42" cy="25" r="2.5" fill="hsl(30 25% 96%)" fillOpacity="0.8" />

        {/* 竖线连接 */}
        <line x1="22" y1="15" x2="22" y2="28" stroke="hsl(30 20% 96%)" strokeWidth="0.6" opacity="0.4" />
        <line x1="32" y1="15" x2="32" y2="28" stroke="hsl(30 20% 96%)" strokeWidth="0.6" opacity="0.4" />
        <line x1="42" y1="15" x2="42" y2="28" stroke="hsl(30 20% 96%)" strokeWidth="0.6" opacity="0.4" />

        {/* AI 脑回路纹样 */}
        <path
          d="M20 36 C20 33, 24 33, 24 36 C24 39, 28 39, 28 36 C28 33, 32 33, 32 36"
          stroke="hsl(36 72% 75%)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M32 36 C32 39, 36 39, 36 36 C36 33, 40 33, 40 36 C40 39, 44 39, 44 36"
          stroke="hsl(36 72% 68%)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* AI 光点 */}
        <circle cx="20" cy="36" r="1.5" fill="hsl(36 80% 80%)" />
        <circle cx="32" cy="36" r="2" fill="hsl(36 80% 85%)" />
        <circle cx="44" cy="36" r="1.5" fill="hsl(36 80% 80%)" />

        {/* 底部横线 - 账本底边 */}
        <line x1="18" y1="44" x2="46" y2="44" stroke="hsl(30 20% 96%)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="20" y1="47" x2="44" y2="47" stroke="hsl(30 20% 96%)" strokeWidth="0.7" strokeLinecap="round" opacity="0.3" />

        {/* 角落装饰 - 中式回纹 */}
        <path d="M10 14 L10 10 L14 10" stroke="hsl(36 72% 70%)" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M50 10 L54 10 L54 14" stroke="hsl(36 72% 70%)" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M10 50 L10 54 L14 54" stroke="hsl(36 72% 70%)" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M50 54 L54 54 L54 50" stroke="hsl(36 72% 70%)" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />

        {/* 微光 */}
        <circle cx="48" cy="12" r="4" fill="hsl(36 80% 85%)" opacity="0.15" />

        <defs>
          <linearGradient id="logo-bg" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="hsl(12 45% 38%)" />
            <stop offset="50%" stopColor="hsl(12 45% 42%)" />
            <stop offset="100%" stopColor="hsl(15 40% 35%)" />
          </linearGradient>
          <linearGradient id="logo-border" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="hsl(12 45% 50%)" />
            <stop offset="100%" stopColor="hsl(12 45% 32%)" />
          </linearGradient>
        </defs>
      </svg>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-display text-[15px] font-bold leading-tight tracking-tight text-sidebar-primary-foreground">
            智能记账
          </span>
          <span className="text-[9px] font-medium tracking-[0.15em] text-sidebar-muted uppercase">
            Smart Ledger
          </span>
        </div>
      )}
    </div>
  )
}
