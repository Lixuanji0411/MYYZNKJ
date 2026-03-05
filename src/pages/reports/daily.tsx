import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Wallet, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { reportService } from '@/services/report.service'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getCategoryColorClass } from '@/lib/category-colors'
import type { DailyReport } from '@/types/report'

export default function DailyReportPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [report, setReport] = useState<DailyReport | null>(null)

  useEffect(() => {
    reportService.getDailyReport(date).then(setReport)
  }, [date])

  function shiftDate(days: number) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().split('T')[0])
  }

  const isToday = date === new Date().toISOString().split('T')[0]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-rich">日结报表</h1>
          <p className="text-sm text-muted-foreground">每日收支明细和利润汇总</p>
        </div>
        <div className="action-bar">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs font-mono min-w-[100px]">
            {date}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(1)} disabled={isToday}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {report && (
        <>
          {/* 汇总卡片 */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(152 55% 40%)' } as React.CSSProperties}>
              <CardContent className="p-4 pl-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">收入</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-income" />
                </div>
                <p className="stat-emboss text-xl font-bold text-income">+{formatCurrency(report.totalIncome)}</p>
              </CardContent>
            </Card>
            <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(0 65% 50%)' } as React.CSSProperties}>
              <CardContent className="p-4 pl-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">支出</span>
                  <ArrowDownRight className="h-3.5 w-3.5 text-expense" />
                </div>
                <p className="stat-emboss text-xl font-bold text-expense">-{formatCurrency(report.totalExpense)}</p>
              </CardContent>
            </Card>
            <Card className="card-premium card-metric bg-gradient-to-br from-primary/5 to-accent/3" style={{ '--metric-color': 'hsl(12 45% 42%)' } as React.CSSProperties}>
              <CardContent className="p-4 pl-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">净利润</span>
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className={cn('stat-emboss text-xl font-bold', report.netProfit >= 0 ? 'text-income' : 'text-expense')}>
                  {report.netProfit >= 0 ? '+' : ''}{formatCurrency(report.netProfit)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 明细列表 */}
          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm"><span className="section-label">收支明细 ({report.records.length} 笔)</span></CardTitle>
            </CardHeader>
            <CardContent>
              {report.records.length > 0 ? (
                <div className="space-y-1">
                  {report.records.map((r) => (
                    <div key={r.id} className="list-item-refined flex items-center justify-between rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', r.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
                          {r.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-income" /> : <ArrowDownRight className="h-4 w-4 text-expense" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-foreground">{r.description}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center rounded px-1.5 py-0 text-[10px] font-medium ${getCategoryColorClass(r.category)}`}>{r.category}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{(r as Record<string, unknown>).time as string || ''}</span>
                          </div>
                        </div>
                      </div>
                      <span className={cn('amount-display shrink-0 font-mono text-[15px] font-bold', r.type === 'income' ? 'text-income' : 'text-expense')}>
                        {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  {date} 暂无收支记录
                </div>
              )}
            </CardContent>
          </Card>

          {/* 通俗解读 */}
          {report.records.length > 0 && (
            <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-transparent gold-frame">
              <CardContent className="p-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold mb-1 text-rich"><FileText className="h-3.5 w-3.5 text-primary" /> 今日小结</p>
                <p className="text-sm text-readable leading-relaxed">
                  {date === new Date().toISOString().split('T')[0] ? '今天' : date}
                  共{report.records.length}笔交易，
                  收入{formatCurrency(report.totalIncome)}元，
                  支出{formatCurrency(report.totalExpense)}元，
                  {report.netProfit >= 0
                    ? `净赚${formatCurrency(report.netProfit)}元。`
                    : `亏损${formatCurrency(Math.abs(report.netProfit))}元，需注意控制支出。`
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </motion.div>
  )
}
