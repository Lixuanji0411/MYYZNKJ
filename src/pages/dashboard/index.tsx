import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Camera,
  Mic,
  FileText,
  PackagePlus,
  ArrowRight,
  AlertTriangle,
  Calendar,
  MessageSquareText,
  Wallet,
  ShieldCheck,
  Package,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Send,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { accountingService } from '@/services/accounting.service'
import { productService } from '@/services/inventory.service'
import { taxService } from '@/services/tax.service'
import { useAuthStore } from '@/stores/auth.store'
import { useChatStore } from '@/stores/chat.store'
import { formatCurrency } from '@/lib/format'
import type { AccountingRecord } from '@/types/accounting'
import type { StockAlert } from '@/types/inventory'
import type { TaxReminder } from '@/types/tax'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'
import { reportService } from '@/services/report.service'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { getCategoryColorClass } from '@/lib/category-colors'

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const CHART_COLORS = [
  'hsl(12 45% 48%)',
  'hsl(36 72% 52%)',
  'hsl(195 55% 46%)',
  'hsl(280 45% 52%)',
  'hsl(152 55% 40%)',
  'hsl(340 55% 50%)',
]

function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const sendMessage = useChatStore((s) => s.sendMessage)
  const isDark = useIsDark()
  const [aiInput, setAiInput] = useState('')
  const [todaySummary, setTodaySummary] = useState({ income: 0, expense: 0, profit: 0, count: 0 })
  const [recentRecords, setRecentRecords] = useState<AccountingRecord[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [taxReminders, setTaxReminders] = useState<TaxReminder[]>([])
  const [expenseByCategory, setExpenseByCategory] = useState<Array<{ category: string; amount: number; percent: number }>>([])
  const [trendData, setTrendData] = useState<Array<{ month: string; income: number; expense: number }>>([])
  const [allRecords, setAllRecords] = useState<AccountingRecord[]>([])

  useEffect(() => {
    async function loadData() {
      const [summary, records, alerts, trend, all] = await Promise.all([
        accountingService.getTodaySummary(),
        accountingService.getRecentRecords(8),
        productService.getStockAlerts(),
        reportService.getIncomeTrend(3),
        accountingService.getAll(),
      ])
      setTodaySummary(summary)
      setRecentRecords(records)
      setStockAlerts(alerts)
      setTrendData(trend)
      setAllRecords(all)

      if (user?.businessType) {
        const reminders = await taxService.getReminders(user.businessType)
        setTaxReminders(reminders)
      }

      const now = new Date()
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const endDate = now.toISOString().split('T')[0]
      const expenses = await accountingService.getExpenseByCategory(startDate, endDate)
      setExpenseByCategory(expenses)
    }
    loadData()
  }, [user?.businessType])

  const monthIncome = allRecords
    .filter((r) => r.type === 'income' && isCurrentMonth(r.date))
    .reduce((s, r) => s + r.amount, 0)
  const monthExpense = allRecords
    .filter((r) => r.type === 'expense' && isCurrentMonth(r.date))
    .reduce((s, r) => s + r.amount, 0)
  const monthProfit = monthIncome - monthExpense
  const profitRate = monthIncome > 0 ? ((monthProfit / monthIncome) * 100) : 0
  const reconciledCount = allRecords.filter((r) => r.isReconciled && isCurrentMonth(r.date)).length
  const totalMonthCount = allRecords.filter((r) => isCurrentMonth(r.date)).length
  const reconciledPct = totalMonthCount > 0 ? Math.round((reconciledCount / totalMonthCount) * 100) : 0

  const weekdayData = getWeekdayStats(allRecords)

  function handleAiSend() {
    if (!aiInput.trim()) return
    sendMessage(aiInput.trim())
    navigate('/ai-chat')
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 warm-glow">

      {/* ═══ 欢迎横幅 + AI 快捷入口 ═══ */}
      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary/8 via-accent/5 to-transparent shadow-sm texture-paper ink-wash">
          <CardContent className="p-0">
            <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    {user?.avatar ? <AvatarImage src={user.avatar} alt={user?.name} /> : null}
                    <AvatarFallback className="bg-primary/15 text-primary font-bold text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="font-display text-xl font-bold leading-tight text-rich">
                      {getGreeting()}，{user?.name || '用户'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {user?.businessName || '我的店铺'} · {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI 快捷提问框 */}
              <div className="flex-1 max-w-md">
                <div className="relative flex items-center gap-2 rounded-xl border border-primary/15 bg-card/80 px-3 py-1.5 backdrop-blur-sm transition-all focus-within:border-primary/40 focus-within:shadow-md focus-within:shadow-primary/5 inner-glow">
                  <MessageSquareText className="h-4 w-4 shrink-0 text-primary/60" />
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                    placeholder="问 AI 助手任何问题…"
                    className="h-8 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button onClick={handleAiSend} size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-primary hover:bg-primary/10">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {['今日收支', '本月利润', '库存预警', '报税提醒'].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setAiInput(q); sendMessage(q); navigate('/ai-chat') }}
                      className="rounded-md bg-primary/5 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ 核心指标卡片 (6个) ═══ */}
      <motion.div variants={fadeUp} className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 指标卡片使用 card-premium + card-metric 质感 */}
        <MetricCard
          label="今日收入"
          value={todaySummary.income}
          icon={<ArrowUpRight className="h-4 w-4" />}
          iconBg="bg-income/10 text-income"
          trend={todaySummary.income > 0 ? '+' : ''}
          color="text-income"
        />
        <MetricCard
          label="今日支出"
          value={todaySummary.expense}
          icon={<ArrowDownRight className="h-4 w-4" />}
          iconBg="bg-expense/10 text-expense"
          color="text-expense"
        />
        <MetricCard
          label="今日利润"
          value={todaySummary.profit}
          icon={<Wallet className="h-4 w-4" />}
          iconBg={todaySummary.profit >= 0 ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}
          color={todaySummary.profit >= 0 ? 'text-income' : 'text-expense'}
        />
        <MetricCard
          label="本月收入"
          value={monthIncome}
          icon={<TrendingUp className="h-4 w-4" />}
          iconBg="bg-chart-2/10 text-chart-2"
          color="text-chart-2"
        />
        <MetricCard
          label="本月利润率"
          value={profitRate}
          decimals={1}
          suffix="%"
          isCurrency={false}
          icon={<BarChart3 className="h-4 w-4" />}
          iconBg="bg-chart-3/10 text-chart-3"
          color="text-chart-3"
        />
        <MetricCard
          label="对账完成率"
          value={reconciledPct}
          decimals={0}
          suffix="%"
          isCurrency={false}
          icon={<ShieldCheck className="h-4 w-4" />}
          iconBg="bg-chart-5/10 text-chart-5"
          color="text-chart-5"
        />
      </motion.div>

      {/* ═══ 快捷操作 ═══ */}
      <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Link to="/ai-chat" className="lg:col-span-1">
          <Card className="group h-full cursor-pointer border-primary/20 bg-gradient-to-br from-primary/8 to-accent/5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 card-hover gold-frame">
            <CardContent className="flex h-full flex-col items-center justify-center gap-2 p-5">
              <div className="icon-vessel h-11 w-11 bg-primary/15 transition-transform group-hover:scale-110">
                <MessageSquareText className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-semibold">AI 智能助手</p>
              <p className="text-[11px] text-muted-foreground text-center">自然语言记账 · 数据分析</p>
            </CardContent>
          </Card>
        </Link>
        {[
          { icon: Camera, label: '拍照记账', desc: '识别发票', path: '/accounting/new?mode=photo', color: 'bg-chart-1/10 text-chart-1' },
          { icon: Mic, label: '语音记账', desc: '说一句话', path: '/accounting/new?mode=voice', color: 'bg-chart-2/10 text-chart-2' },
          { icon: FileText, label: '模板记账', desc: '快速录入', path: '/accounting/new?mode=template', color: 'bg-chart-3/10 text-chart-3' },
          { icon: PackagePlus, label: '一键入库', desc: '进货入库', path: '/inventory/stock-in', color: 'bg-chart-4/10 text-chart-4' },
        ].map((action) => (
          <Link key={action.label} to={action.path}>
            <Card className="group h-full cursor-pointer card-premium">
              <CardContent className="flex h-full items-center gap-3 p-4">
                <div className={cn('icon-vessel h-10 w-10 shrink-0 transition-transform group-hover:scale-105', action.color)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="text-[11px] text-muted-foreground">{action.desc}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </motion.div>

      {/* ═══ 图表区域 (收支趋势 + 支出分布 + 每日营收柱图) ═══ */}
      <div className="grid gap-4 lg:grid-cols-12">
        <motion.div variants={fadeUp} className="lg:col-span-5">
          <Card className="card-premium h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold"><span className="section-label">收支趋势</span></CardTitle>
              <Link to="/reports/monthly">
                <Button variant="ghost" size="sm" className="h-7 text-[11px]">
                  详情 <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(152 55% 40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(152 55% 40%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0 65% 50%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(0 65% 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'hsl(18 20% 22%)' : 'hsl(25 18% 88%)'} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? 'hsl(30 16% 68%)' : 'hsl(20 12% 48%)' }} stroke={isDark ? 'hsl(18 20% 22%)' : 'hsl(20 12% 48%)'} />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? 'hsl(30 16% 68%)' : 'hsl(20 12% 48%)' }} stroke={isDark ? 'hsl(18 20% 22%)' : 'hsl(20 12% 48%)'} />
                    <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px', border: isDark ? '1px solid hsl(18 20% 22%)' : '1px solid hsl(25 18% 88%)', background: isDark ? 'hsl(18 20% 14%)' : '#fff', color: isDark ? 'hsl(30 18% 90%)' : 'inherit' }} />
                    <Area type="monotone" dataKey="income" stroke={isDark ? 'hsl(152 55% 48%)' : 'hsl(152 55% 40%)'} fill="url(#incomeGrad)" strokeWidth={2} name="收入" />
                    <Area type="monotone" dataKey="expense" stroke={isDark ? 'hsl(0 65% 58%)' : 'hsl(0 65% 50%)'} fill="url(#expenseGrad)" strokeWidth={2} name="支出" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无趋势数据</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card className="card-premium h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold"><span className="section-label">本月支出分布</span></CardTitle>
            </CardHeader>
            <CardContent>
              {expenseByCategory.length > 0 ? (
                <div className="space-y-3">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={3} dataKey="amount" nameKey="category">
                        {expenseByCategory.map((_entry, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {expenseByCategory.slice(0, 5).map((item, index) => (
                      <div key={item.category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                          <span className={`inline-flex items-center rounded px-1.5 py-0 text-[10px] font-medium ${getCategoryColorClass(item.category)}`}>{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{formatCurrency(item.amount)}</span>
                          <span className="text-muted-foreground">{item.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无支出数据</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="lg:col-span-4">
          <Card className="card-premium h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold"><span className="section-label">本周每日营收</span></CardTitle>
            </CardHeader>
            <CardContent>
              {weekdayData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weekdayData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'hsl(18 20% 22%)' : 'hsl(25 18% 88%)'} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: isDark ? 'hsl(30 16% 68%)' : 'hsl(20 12% 48%)' }} stroke={isDark ? 'hsl(18 20% 22%)' : 'hsl(20 12% 48%)'} />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? 'hsl(30 16% 68%)' : 'hsl(20 12% 48%)' }} stroke={isDark ? 'hsl(18 20% 22%)' : 'hsl(20 12% 48%)'} />
                    <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px', border: isDark ? '1px solid hsl(18 20% 22%)' : '1px solid hsl(25 18% 88%)', background: isDark ? 'hsl(18 20% 14%)' : '#fff', color: isDark ? 'hsl(30 18% 90%)' : 'inherit' }} />
                    <Bar dataKey="income" fill={isDark ? 'hsl(152 55% 48%)' : 'hsl(152 55% 40%)'} radius={[4, 4, 0, 0]} name="收入" barSize={16} />
                    <Bar dataKey="expense" fill={isDark ? 'hsl(0 65% 58%)' : 'hsl(0 65% 50%)'} radius={[4, 4, 0, 0]} name="支出" barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">暂无本周数据</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ═══ 精致双线分隔 ═══ */}
      <div className="divider-ornate my-3">
        <span className="diamond-dot" />
      </div>

      {/* ═══ 近期流水 + 经营看板 + 提醒 ═══ */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* 近期流水 */}
        <motion.div variants={fadeUp} className="lg:col-span-5">
          <Card className="card-premium">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold"><span className="section-label">近期流水</span></CardTitle>
              <Link to="/accounting"><Button variant="ghost" size="sm" className="h-7 text-[11px]">全部 <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
            </CardHeader>
            <CardContent>
              {recentRecords.length > 0 ? (
                <div className="space-y-1">
                  {recentRecords.slice(0, 6).map((record) => (
                    <div key={record.id} className="list-item-refined flex items-center justify-between rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', record.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
                          {record.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-income" /> : <ArrowDownRight className="h-4 w-4 text-expense" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-foreground">{record.description}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center rounded px-1.5 py-0 text-[10px] font-medium ${getCategoryColorClass(record.category)}`}>{record.category}</span>
                            <span className="text-[11px] text-muted-foreground">{record.date} {record.time || (() => { try { return format(parseISO(record.createdAt), 'HH:mm') } catch { return '' } })()}</span>
                          </div>
                        </div>
                      </div>
                      <span className={cn('amount-display shrink-0 font-mono text-[15px] font-bold', record.type === 'income' ? 'text-income' : 'text-expense')}>
                        {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">暂无记录</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 经营看板 */}
        <motion.div variants={fadeUp} className="lg:col-span-4">
          <Card className="card-premium h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold"><span className="section-label"><BarChart3 className="h-3.5 w-3.5" /> 本月经营看板</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-primary/8 to-accent/4 p-4">
                <p className="text-xs text-muted-foreground">本月累计利润</p>
                <p className={cn('amount-display mt-1 text-2xl font-bold', monthProfit >= 0 ? 'text-income' : 'text-expense')}>
                  {monthProfit >= 0 ? '+' : ''}{formatCurrency(monthProfit)}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>收入 <strong className="text-income">{formatCurrency(monthIncome)}</strong></span>
                  <span>支出 <strong className="text-expense">{formatCurrency(monthExpense)}</strong></span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">对账进度</span>
                    <span className="font-mono font-medium">{reconciledCount}/{totalMonthCount}</span>
                  </div>
                  <Progress value={reconciledPct} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">利润率</span>
                    <span className="font-mono font-medium">{profitRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(profitRate, 100)} className="h-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border/50 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">库存预警</p>
                  <p className={cn('mt-0.5 text-lg font-bold', stockAlerts.length > 0 ? 'text-warning' : 'text-income')}>
                    {stockAlerts.length}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">待申报</p>
                  <p className={cn('mt-0.5 text-lg font-bold', taxReminders.length > 0 ? 'text-chart-1' : 'text-income')}>
                    {taxReminders.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 提醒面板 */}
        <motion.div variants={fadeUp} className="lg:col-span-3 space-y-4">
          {taxReminders.length > 0 && (
            <Card className="card-premium">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> 申报提醒
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {taxReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-2">
                    <div>
                      <p className="text-xs font-medium">{reminder.periodLabel}</p>
                      <p className="text-[11px] text-muted-foreground">截止 {reminder.dueDate}</p>
                    </div>
                    <Badge variant={reminder.status === 'overdue' ? 'destructive' : reminder.status === 'urgent' ? 'default' : 'secondary'} className="text-[10px]">
                      {reminder.status === 'overdue' ? '已逾期' : `${reminder.daysRemaining}天`}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {stockAlerts.length > 0 && (
            <Card className="card-premium">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" /> 库存预警
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stockAlerts.slice(0, 4).map((alert) => (
                  <div key={alert.productId} className="flex items-center justify-between rounded-lg bg-warning/5 p-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-warning" />
                      <span className="text-xs font-medium">{alert.productName}</span>
                    </div>
                    <Badge variant="destructive" className="text-[10px] font-mono">
                      剩{alert.currentStock}
                    </Badge>
                  </div>
                ))}
                {stockAlerts.length > 4 && (
                  <Link to="/inventory" className="block text-center text-[11px] text-primary hover:underline">
                    查看全部 {stockAlerts.length} 个
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {taxReminders.length === 0 && stockAlerts.length === 0 && (
            <Card className="border-border/50">
              <CardContent className="flex h-28 items-center justify-center p-4">
                <div className="text-center">
                  <ShieldCheck className="mx-auto h-6 w-6 text-income/60" />
                  <p className="mt-1.5 text-xs text-muted-foreground">一切正常，暂无预警</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ── 指标卡片组件 ── */
function MetricCard({
  label,
  value,
  decimals = 2,
  suffix = '',
  isCurrency = true,
  icon,
  iconBg,
  trend,
  color,
}: {
  label: string
  value: number
  decimals?: number
  suffix?: string
  isCurrency?: boolean
  icon: React.ReactNode
  iconBg: string
  trend?: string
  color: string
}) {
  return (
    <Card className="card-premium card-metric" style={{ '--metric-color': getMetricCssColor(color) } as React.CSSProperties}>
      <CardContent className="p-4 pl-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">{label}</span>
          <div className={cn('icon-vessel h-7 w-7', iconBg)}>
            {icon}
          </div>
        </div>
        <AnimatedNumber
          value={value}
          prefix={isCurrency && value !== 0 ? (trend || '') : ''}
          suffix={suffix}
          decimals={decimals}
          className={cn('stat-emboss text-xl font-bold', color)}
        />
      </CardContent>
    </Card>
  )
}

/* ── 工具函数 ── */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

function isCurrentMonth(dateStr: string): boolean {
  const now = new Date()
  const d = new Date(dateStr)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function getMetricCssColor(colorClass: string): string {
  const map: Record<string, string> = {
    'text-income': 'hsl(152 55% 40%)',
    'text-expense': 'hsl(0 65% 50%)',
    'text-chart-1': 'hsl(12 45% 48%)',
    'text-chart-2': 'hsl(36 72% 52%)',
    'text-chart-3': 'hsl(195 55% 46%)',
    'text-chart-4': 'hsl(280 45% 52%)',
    'text-chart-5': 'hsl(152 55% 40%)',
    'text-primary': 'hsl(12 45% 42%)',
  }
  return map[colorClass] || 'hsl(12 45% 42%)'
}

function getWeekdayStats(records: AccountingRecord[]) {
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - dayOfWeek + 1)
  monday.setHours(0, 0, 0, 0)

  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const result = days.map((day, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dayRecords = records.filter((r) => r.date === dateStr)
    return {
      day,
      income: dayRecords.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0),
      expense: dayRecords.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0),
    }
  })
  return result
}
