import { RouterProvider } from 'react-router-dom'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import { useEffect } from 'react'
import { useUiStore } from '@/stores/ui.store'
import { seedTestData } from '@/lib/seed-data'

function App() {
  const theme = useUiStore((s) => s.theme)

  useEffect(() => {
    seedTestData()
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}

export default App
