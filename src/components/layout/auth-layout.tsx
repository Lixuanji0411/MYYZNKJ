import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { Wallet } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 lg:flex lg:flex-col lg:justify-between bg-sidebar p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold text-white">智能记账</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-6"
        >
          <h1 className="font-display text-4xl font-bold leading-tight text-white">
            让记账变得
            <br />
            <span className="text-sidebar-primary">简单智能</span>
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-sidebar-foreground">
            多模态录入、自动分类、智能税务、库存联动 —— 专为小微企业打造的一站式财务管理平台。
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: '拍照记账', desc: '发票自动识别' },
              { label: '语音录入', desc: '说一句就记好' },
              { label: '智能报税', desc: '一键生成申报表' },
              { label: 'AI 助手', desc: '自然语言查账' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4"
              >
                <p className="text-sm font-semibold text-sidebar-accent-foreground">{item.label}</p>
                <p className="mt-1 text-xs text-sidebar-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-xs text-sidebar-muted">
          &copy; {new Date().getFullYear()} 智能记账系统
        </p>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}
