import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { taxService } from '@/services/tax.service'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'
import type { TaxReminder } from '@/types/tax'

export default function TaxCalendarPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [reminders, setReminders] = useState<TaxReminder[]>([])

  useEffect(() => {
    if (user?.businessType) {
      taxService.getReminders(user.businessType).then(setReminders)
    }
  }, [user?.businessType])

  const steps = [
    { step: 1, title: '登录电子税务局', desc: '访问当地税务局官网或APP' },
    { step: 2, title: '找到对应申报入口', desc: '如"增值税申报"或"个税经营所得"' },
    { step: 3, title: '导入本系统生成的表格', desc: '在"生成申报表"页面下载后上传' },
    { step: 4, title: '核对数据并提交', desc: '仔细核对红色标注的关键数据' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-xl font-bold text-rich">申报日历</h1>
          <p className="text-sm text-muted-foreground">各税种申报周期与截止日期一览</p>
        </div>
      </div>

      {/* 提醒卡片 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {reminders.map((r) => {
          const pct = Math.max(0, Math.min(100, 100 - (r.daysRemaining / 90) * 100))
          return (
            <Card key={r.id} className={cn('border-border/50 card-hover', r.status === 'overdue' && 'border-expense/30')}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {r.status === 'overdue' ? (
                      <AlertTriangle className="h-4 w-4 text-expense" />
                    ) : r.status === 'urgent' ? (
                      <Clock className="h-4 w-4 text-warning" />
                    ) : (
                      <Calendar className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-sm font-semibold">{r.periodLabel}</span>
                  </div>
                  <Badge
                    variant={r.status === 'overdue' ? 'destructive' : r.status === 'urgent' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {r.status === 'overdue' ? '已逾期' : `剩${r.daysRemaining}天`}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">截止日期</span>
                    <span className="font-mono font-medium">{r.dueDate}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={() => navigate('/tax/declaration')}
                  >
                    生成申报表
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={() => navigate('/reports/tax-summary')}
                  >
                    查看汇总
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {reminders.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="flex h-32 items-center justify-center p-6">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-income/60" />
              <p className="mt-2 text-sm text-muted-foreground">暂无申报提醒</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 申报步骤指引 */}
      <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm"><ClipboardList className="h-3.5 w-3.5 text-primary" /> 申报步骤指引</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={s.step} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {s.step}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="ml-3 hidden sm:block border-l border-primary/10 h-8 -mb-3" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
