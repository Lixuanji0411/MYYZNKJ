import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiStore {
  sidebarCollapsed: boolean
  chatPanelOpen: boolean
  theme: 'light' | 'dark' | 'system'

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleChatPanel: () => void
  setChatPanelOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      chatPanelOpen: false,
      theme: 'light',

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
      toggleChatPanel: () => set((state) => ({ chatPanelOpen: !state.chatPanelOpen })),
      setChatPanelOpen: (open: boolean) => set({ chatPanelOpen: open }),
      setTheme: (theme: 'light' | 'dark' | 'system') => {
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

        set({ theme })
      },
    }),
    {
      name: 'znjz_ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
)
