import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { taxService } from '@/services/tax.service'
import { useAuthStore } from '@/stores/auth.store'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { exportTaxDeclaration } from '@/lib/export'
import type { TaxDeclaration } from '@/types/tax'

export default function DeclarationPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [generating, setGenerating] = useState(false)
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>([])

  async function handleGenerate(taxType: 'vat' | 'income_tax') {
    setGenerating(true)
    try {
      const now = new Date()
      const q = Math.floor(now.getMonth() / 3)
      const qStart = new Date(now.getFullYear(), q * 3, 1)
      const qEnd = new Date(now.getFullYear(), q * 3 + 3, 0)
      const start = qStart.toISOString().split('T')[0]
      const end = qEnd.toISOString().split('T')[0]

      const decl = await taxService.generateDeclaration(
        taxType, start, end, user?.businessType || 'individual'
      )
      setDeclarations((prev) => [...prev.filter((d) => d.taxType !== taxType), decl])
      toast.success(`${taxType === 'vat' ? '增值税' : '所得税'}申报表已生成`)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-xl font-bold text-rich">生成申报表</h1>
          <p className="text-sm text-muted-foreground">从记账数据自动提取申报数据，一键生成</p>
        </div>
      </div>

      {/* 生成按钮 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-border/50 card-hover cursor-pointer" onClick={() => handleGenerate('vat')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-1/10">
              <Download className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <p className="text-sm font-semibold">增值税申报表</p>
              <p className="text-[11px] text-muted-foreground">小规模纳税人按季申报</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover cursor-pointer" onClick={() => handleGenerate('income_tax')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-2/10">
              <Download className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-sm font-semibold">个人所得税(经营所得)</p>
              <p className="text-[11px] text-muted-foreground">按季预缴申报</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {generating && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground animate-pulse">正在计算申报数据...</p>
        </div>
      )}

      {/* 已生成的申报表 */}
      {declarations.map((decl) => (
        <Card key={decl.id} className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {decl.taxType === 'vat' ? '增值税申报表' : '个人所得税(经营所得)'}
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">{decl.periodStart} ~ {decl.periodEnd}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              {[
                { label: '销售额', value: decl.salesAmount, hl: false },
                { label: '成本费用', value: decl.costAmount, hl: false },
                { label: '应税金额', value: decl.taxableAmount, hl: true },
                { label: decl.isExempt ? '免税额' : '应纳税额', value: decl.isExempt ? decl.exemptAmount : decl.taxAmount, hl: true },
              ].map((item) => (
                <div key={item.label} className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2',
                  item.hl ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted/30'
                )}>
                  <div className="flex items-center gap-1.5">
                    {item.hl && <AlertCircle className="h-3 w-3 text-primary" />}
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <span className={cn('amount-display text-xs font-semibold', item.hl && 'text-primary')}>
                    ¥{formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>

            {decl.isExempt && (
              <div className="flex items-center gap-2 rounded-lg bg-income/5 p-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-income" />
                <p className="text-xs text-income font-medium">{decl.exemptReason}</p>
              </div>
            )}

            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => { try { exportTaxDeclaration(decl as unknown as Record<string, unknown>); toast.success('申报表已导出为 Excel 文件') } catch { toast.error('导出失败') } }}>
              <Download className="h-3 w-3" /> 导出Excel申报表
            </Button>
          </CardContent>
        </Card>
      ))}

      {declarations.length === 0 && !generating && (
        <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              点击上方卡片即可根据记账数据自动生成对应税种的申报表。
              系统将自动提取「销售额」「成本」「应纳税额」等数据，关键数据会高亮标注并附说明。
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
