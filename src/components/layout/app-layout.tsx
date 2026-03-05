import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { motion } from 'framer-motion'

export default function AppLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-background texture-paper">
      <Sidebar />
      <motion.div
        initial={false}
        animate={{ marginLeft: collapsed ? 68 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex min-h-screen flex-col"
      >
        <Header />
        <main className="flex-1 p-6 warm-glow">
          <motion.div
            key={undefined}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </motion.div>
    </div>
  )
}
