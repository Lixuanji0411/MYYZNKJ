import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  CheckCheck,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNotificationStore, type Notification } from '@/stores/notification.store'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const typeConfig: Record<Notification['type'], { icon: typeof Bell; color: string; label: string }> = {
  warning: { icon: AlertTriangle, color: 'text-warning bg-warning/10', label: '预警' },
  reminder: { icon: Calendar, color: 'text-primary bg-primary/10', label: '提醒' },
  success: { icon: CheckCircle2, color: 'text-income bg-income/10', label: '完成' },
  info: { icon: Info, color: 'text-chart-1 bg-chart-1/10', label: '通知' },
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotificationStore()
  const unreadCount = notifications.filter((n) => !n.isRead).length

  function handleClick(notification: Notification) {
    markAsRead(notification.id)
    if (notification.link) {
      navigate(notification.link)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="page-header flex-1">
          <h1 className="font-display text-xl font-bold text-rich">消息通知</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} 条未读消息` : '所有消息已读'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={markAllAsRead}>
            <CheckCheck className="h-3.5 w-3.5" /> 全部已读
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="icon-vessel h-14 w-14 rounded-xl bg-muted/50 mb-4">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">暂无通知消息</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type]
            const Icon = config.icon
            const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: zhCN,
            })

            return (
              <Card
                key={notification.id}
                className={cn(
                  'cursor-pointer border-border/40 transition-all hover:shadow-sm',
                  !notification.isRead && 'border-l-2 border-l-primary bg-primary/[0.02]'
                )}
                onClick={() => handleClick(notification)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={cn('icon-vessel h-9 w-9 shrink-0 rounded-lg', config.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm font-medium', !notification.isRead && 'font-semibold')}>
                        {notification.title}
                      </p>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {config.label}
                      </Badge>
                      {!notification.isRead && (
                        <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{timeAgo}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNotification(notification.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
