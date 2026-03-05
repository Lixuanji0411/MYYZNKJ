import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { reportService } from '@/services/report.service'
import { useAuthStore } from '@/stores/auth.store'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { exportTaxSummary } from '@/lib/export'
import type { TaxSummaryReport } from '@/types/report'

export default function TaxSummaryPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [report, setReport] = useState<TaxSummaryReport | null>(null)

  useEffect(() => {
    const now = new Date()
    const q = Math.floor(now.getMonth() / 3)
    const qStart = new Date(now.getFullYear(), q * 3, 1)
    const qEnd = new Date(now.getFullYear(), q * 3 + 3, 0)
    const start = qStart.toISOString().split('T')[0]
    const end = qEnd.toISOString().split('T')[0]
    reportService.getTaxSummaryReport(start, end).then(setReport)
  }, [])

  function handleExport() {
    if (!report) return
    try {
      exportTaxSummary(report as unknown as Record<string, unknown>)
      toast.success('报税汇总已导出为 Excel 文件')
    } catch {
      toast.error('导出失败')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-rich">报税汇总</h1>
          <p className="text-sm text-muted-foreground">
            {user?.businessType === 'individual' ? '个体工商户' : '小规模纳税人'} · 本季度申报数据
          </p>
        </div>
        <div className="action-bar">
          <Button size="sm" onClick={handleExport} className="gap-1.5 rounded-lg">
            <Download className="h-3.5 w-3.5" /> 导出申报表
          </Button>
        </div>
      </div>

      {report && (
        <>
          {/* 核心数据 */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(36 72% 52%)' } as React.CSSProperties}>
              <CardContent className="p-4 pl-5">
                <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">销售总额</p>
                <p className="stat-emboss mt-1 text-xl font-bold">{formatCurrency(report.totalSales)}</p>
              </CardContent>
            </Card>
            <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(0 65% 50%)' } as React.CSSProperties}>
              <CardContent className="p-4 pl-5">
                <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">成本费用</p>
                <p className="stat-emboss mt-1 text-xl font-bold text-expense">{formatCurrency(report.totalCost)}</p>
              </CardContent>
            </Card>
            <Card className="card-premium card-metric bg-gradient-to-br from-primary/5 to-accent/3" style={{ '--metric-color': 'hsl(12 45% 42%)' } as React.CSSProperties}>
              <CardContent className="p-4 pl-5">
                <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">毛利润</p>
                <p className={cn('stat-emboss mt-1 text-xl font-bold', report.grossProfit >= 0 ? 'text-income' : 'text-expense')}>
                  {formatCurrency(report.grossProfit)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 免税提示 */}
          {report.isVatExempt && (
            <Card className="border-income/20 bg-income/5 inner-glow">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-income" />
                <div>
                  <p className="text-sm font-semibold text-income">恭喜！本季度免征增值税</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{report.exemptReason}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 申报数据明细 */}
          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm"><span className="section-label">申报数据明细</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {report.highlights.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      'list-item-refined flex items-center justify-between rounded-lg px-3 py-2.5',
                      item.isHighlighted ? 'bg-primary/5 border border-primary/10' : ''
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {item.isHighlighted && <AlertCircle className="h-3.5 w-3.5 text-primary" />}
                      <span className="text-sm">{item.label}</span>
                      {item.note && (
                        <Badge variant="outline" className="text-[9px] text-primary border-primary/20">
                          {item.note}
                        </Badge>
                      )}
                    </div>
                    <span className={cn('amount-display text-sm font-semibold', item.isHighlighted && 'text-primary')}>
                      ¥{formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 申报期间 */}
          <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-transparent gold-frame">
            <CardContent className="p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold mb-1 text-rich"><FileText className="h-3.5 w-3.5 text-primary" /> 申报说明</p>
              <p className="text-sm text-readable leading-relaxed">
                本报表汇总了 {report.period} 期间的经营数据。
                {report.isVatExempt
                  ? '本季度销售额未超过30万元，免征增值税，申报时请在"免税销售额"栏填入对应数据。'
                  : `本季度应缴增值税 ¥${formatCurrency(report.vatAmount)}，请在电子税务局按时申报。`
                }
                个人所得税按经营所得预缴 ¥{formatCurrency(report.incomeTaxAmount)}。
                以上数据仅供参考，建议核对后再提交。
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  )
}
