import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { reportService } from '@/services/report.service'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getCategoryColorClass } from '@/lib/category-colors'
import type { MonthlyReport } from '@/types/report'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts'

const COLORS = [
  'hsl(12 45% 48%)', 'hsl(36 72% 52%)', 'hsl(195 55% 46%)',
  'hsl(280 45% 52%)', 'hsl(152 55% 40%)', 'hsl(340 55% 50%)',
]

function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

export default function MonthlyReportPage() {
  const navigate = useNavigate()
  const isDark = useIsDark()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState<MonthlyReport | null>(null)

  useEffect(() => {
    reportService.getMonthlyReport(year, month).then(setReport)
  }, [year, month])

  function shiftMonth(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setYear(y)
    setMonth(m)
  }

  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1

  const dailyChartData = report ? report.dailyIncome.map((d, i) => ({
    date: d.date.split('-')[2],
    income: d.amount,
    expense: report.dailyExpense[i]?.amount || 0,
  })) : []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-rich">月结报表</h1>
          <p className="text-sm text-muted-foreground">月度利润汇总与趋势分析</p>
        </div>
        <div className="action-bar">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs font-medium min-w-[80px]">
            {year}年{month}月
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftMonth(1)} disabled={isCurrent}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {report && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(152 55% 40%)' } as React.CSSProperties}>
              <CardContent className="p-4 pl-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">月收入</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-income" />
                </div>
                <p className="stat-emboss text-xl font-bold text-income">{formatCurrency(report.totalIncome)}</p>
              </CardContent>
            </Card>
            <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(0 65% 50%)' } as React.CSSProperties}>
              <CardContent className="p-4 pl-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">月支出</span>
                  <ArrowDownRight className="h-3.5 w-3.5 text-expense" />
                </div>
                <p className="stat-emboss text-xl font-bold text-expense">{formatCurrency(report.totalExpense)}</p>
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
            <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(36 72% 52%)' } as React.CSSProperties}>
              <CardContent className="p-4 pl-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">环比</span>
                  {report.profitChange >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-income" /> : <TrendingDown className="h-3.5 w-3.5 text-expense" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <p className={cn('stat-emboss text-xl font-bold', report.profitChange >= 0 ? 'text-income' : 'text-expense')}>
                    {report.profitChangePercent >= 0 ? '+' : ''}{report.profitChangePercent}%
                  </p>
                  <Badge variant={report.profitChange >= 0 ? 'secondary' : 'destructive'} className="text-[9px]">
                    {report.profitChange >= 0 ? '↑' : '↓'}{formatCurrency(Math.abs(report.profitChange))}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="card-premium lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm"><span className="section-label">每日收支趋势</span></CardTitle></CardHeader>
              <CardContent>
                {dailyChartData.some((d) => d.income > 0 || d.expense > 0) ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={dailyChartData}>
                      <defs>
                        <linearGradient id="mIncG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(152 55% 40%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(152 55% 40%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="mExpG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(0 65% 50%)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(0 65% 50%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'hsl(18 20% 22%)' : 'hsl(25 18% 88%)'} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? 'hsl(30 16% 68%)' : 'hsl(20 12% 48%)' }} stroke={isDark ? 'hsl(18 20% 22%)' : 'hsl(20 12% 48%)'} />
                      <YAxis tick={{ fontSize: 10, fill: isDark ? 'hsl(30 16% 68%)' : 'hsl(20 12% 48%)' }} stroke={isDark ? 'hsl(18 20% 22%)' : 'hsl(20 12% 48%)'} />
                      <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '11px', border: isDark ? '1px solid hsl(18 20% 22%)' : '1px solid hsl(25 18% 88%)', background: isDark ? 'hsl(18 20% 14%)' : '#fff', color: isDark ? 'hsl(30 18% 90%)' : 'inherit' }} />
                      <Area type="monotone" dataKey="income" stroke="hsl(152 55% 40%)" fill="url(#mIncG)" strokeWidth={2} name="收入" />
                      <Area type="monotone" dataKey="expense" stroke="hsl(0 65% 50%)" fill="url(#mExpG)" strokeWidth={2} name="支出" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">暂无数据</div>
                )}
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardHeader className="pb-2"><CardTitle className="text-sm"><span className="section-label">支出分布</span></CardTitle></CardHeader>
              <CardContent>
                {report.expenseByCategory.length > 0 ? (
                  <div className="space-y-3">
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={report.expenseByCategory} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="amount" nameKey="category">
                          {report.expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5">
                      {report.expenseByCategory.slice(0, 5).map((item, i) => (
                        <div key={item.category} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className={`inline-flex items-center rounded px-1.5 py-0 text-[10px] font-medium ${getCategoryColorClass(item.category)}`}>{item.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{formatCurrency(item.amount)}</span>
                            <span className="text-muted-foreground w-8 text-right">{item.percent}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">暂无支出</div>
                )}
              </CardContent>
            </Card>
          </div>

          {report.summary && (
            <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-transparent gold-frame">
              <CardContent className="p-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold mb-1 text-rich"><TrendingUp className="h-3.5 w-3.5 text-primary" /> 月度经营分析</p>
                <p className="text-sm text-readable leading-relaxed">{report.summary}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </motion.div>
  )
}
