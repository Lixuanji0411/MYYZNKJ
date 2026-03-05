import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'reminder'
  isRead: boolean
  createdAt: string
  link?: string
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number

  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void
  removeNotification: (id: string) => void
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function getInitialNotifications(): Notification[] {
  const now = new Date()
  return [
    {
      id: generateId(),
      title: '库存预警',
      message: '棒球帽库存仅剩 3 顶，已低于警戒线(10)，请及时补货。',
      type: 'warning',
      isRead: false,
      createdAt: new Date(now.getTime() - 30 * 60000).toISOString(),
      link: '/inventory',
    },
    {
      id: generateId(),
      title: '库存预警',
      message: '秋季外套库存仅剩 4 件，已低于警戒线(5)，请及时补货。',
      type: 'warning',
      isRead: false,
      createdAt: new Date(now.getTime() - 45 * 60000).toISOString(),
      link: '/inventory',
    },
    {
      id: generateId(),
      title: '报税提醒',
      message: '增值税(按季申报)将于 2026-04-14 截止，请提前准备申报材料。',
      type: 'reminder',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      link: '/tax',
    },
    {
      id: generateId(),
      title: '对账完成',
      message: '本月已完成 31 笔记录对账，对账率达到 89%。仍有 4 笔待核实。',
      type: 'info',
      isRead: true,
      createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      link: '/accounting/reconciliation',
    },
    {
      id: generateId(),
      title: '月结报表已生成',
      message: '2026年2月月结报表已自动生成，本月利润 +4,850.00 元。',
      type: 'success',
      isRead: true,
      createdAt: new Date(now.getTime() - 48 * 3600000).toISOString(),
      link: '/reports/monthly',
    },
  ]
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: getInitialNotifications(),
      unreadCount: 0,

      markAsRead: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: generateId(),
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            ...state.notifications,
          ],
        })),

      removeNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'znjz_notifications',
    }
  )
)
