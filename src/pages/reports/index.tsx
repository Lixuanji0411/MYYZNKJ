import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, Calendar, CalendarRange, FileSpreadsheet, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const reportItems = [
  {
    title: '日结报表',
    desc: '查看每日收支明细和利润',
    icon: Calendar,
    path: '/reports/daily',
    color: 'bg-chart-1/10 text-chart-1',
  },
  {
    title: '月结报表',
    desc: '月度收支趋势和分类统计',
    icon: CalendarRange,
    path: '/reports/monthly',
    color: 'bg-chart-2/10 text-chart-2',
  },
  {
    title: '报税汇总',
    desc: '生成报税所需的数据汇总表',
    icon: FileSpreadsheet,
    path: '/reports/tax-summary',
    color: 'bg-chart-3/10 text-chart-3',
  },
]

export default function ReportsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="page-header">
        <h1 className="font-display text-2xl font-bold text-rich">智能报表</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          核心报表 · 数据可视化 · 通俗解读
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Card className="group cursor-pointer card-premium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`icon-vessel h-10 w-10 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base"><span className="section-label">报表说明</span></CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>本系统提供以下核心报表功能：</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li><strong>日结报表</strong>：每日收支明细，按时间顺序展示当日所有交易</li>
              <li><strong>月结报表</strong>：月度汇总，包含收支趋势图、分类占比饼图、环比分析</li>
              <li><strong>报税汇总</strong>：按报税周期汇总销售额、成本、应纳税额，标注重点填报项</li>
            </ul>
            <p>所有报表均提供通俗易懂的文字解读，帮助您快速了解经营状况。</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
