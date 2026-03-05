import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Search,
  Plus,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { accountingService } from '@/services/accounting.service'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { importExcelFile, exportAccountingRecords } from '@/lib/export'
import { DataTablePagination, paginateData, type PaginationState } from '@/components/shared/data-table-pagination'
import { getCategoryColorClass } from '@/lib/category-colors'
import type { AccountingRecord } from '@/types/accounting'

interface BankEntry {
  date: string
  amount: number
  type: 'income' | 'expense'
  description: string
  matched?: boolean
  matchedRecordId?: string
}

/** 将 Excel 解析的原始行数据规范化为 BankEntry[] */
function parseBankExcelData(rows: Record<string, unknown>[]): BankEntry[] {
  return rows.map((row) => {
    // 兼容多种列名: 日期/交易日期/Date, 金额/交易金额/Amount, 摘要/描述/备注...
    const dateVal = (row['日期'] || row['交易日期'] || row['记账日期'] || row['Date'] || row['date'] || '') as string
    const amountRaw = row['金额'] || row['交易金额'] || row['发生额'] || row['Amount'] || row['amount'] || 0
    const desc = (row['摘要'] || row['描述'] || row['备注'] || row['交易摘要'] || row['对方户名'] || row['Description'] || row['description'] || '') as string
    const typeHint = (row['类型'] || row['收支'] || row['交易类型'] || row['type'] || '') as string

    let amount = typeof amountRaw === 'number' ? amountRaw : parseFloat(String(amountRaw).replace(/[,，]/g, '')) || 0
    let type: 'income' | 'expense' = 'expense'

    if (typeHint) {
      const t = String(typeHint).toLowerCase()
      if (t.includes('收入') || t.includes('income') || t.includes('入') || t.includes('贷')) type = 'income'
    } else if (amount > 0) {
      type = 'income'
    }
    amount = Math.abs(amount)

    // 日期格式规范化
    let date = String(dateVal).trim()
    if (/^\d{8}$/.test(date)) date = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
    date = date.replace(/\//g, '-').replace(/\./g, '-')
    if (!date || date === 'undefined') date = new Date().toISOString().split('T')[0]

    return { date, amount, type, description: desc || '银行流水' }
  }).filter(e => e.amount > 0)
}

/** 将银行流水与记账记录进行智能匹配（搜索所有记录，包含已对账的） */
async function matchBankEntries(
  entries: BankEntry[],
  accountRecords: AccountingRecord[]
): Promise<{ matched: BankEntry[]; unmatched: BankEntry[]; matchedRecordIds: string[]; newlyReconciledIds: string[] }> {
  const usedIds = new Set<string>()
  const matched: BankEntry[] = []
  const unmatched: BankEntry[] = []

  for (const entry of entries) {
    // 优先精确匹配: 金额相同 + 日期相同 + 类型相同
    let match = accountRecords.find(r =>
      !usedIds.has(r.id) && r.amount === entry.amount && r.date === entry.date && r.type === entry.type
    )
    // 次优: 金额相同 + 日期差≤3天
    if (!match) {
      match = accountRecords.find(r => {
        if (usedIds.has(r.id) || r.amount !== entry.amount || r.type !== entry.type) return false
        const d1 = new Date(r.date).getTime()
        const d2 = new Date(entry.date).getTime()
        return Math.abs(d1 - d2) <= 3 * 86400000
      })
    }
    // 再次: 只匹配金额+类型 (忽略日期)
    if (!match) {
      match = accountRecords.find(r =>
        !usedIds.has(r.id) && r.amount === entry.amount && r.type === entry.type
      )
    }
    if (match) {
      usedIds.add(match.id)
      matched.push({ ...entry, matched: true, matchedRecordId: match.id })
    } else {
      unmatched.push({ ...entry, matched: false })
    }
  }

  // 仅筛选需要新标记为已对账的记录ID（跳过已对账的）
  const newlyReconciledIds = Array.from(usedIds).filter(
    id => !accountRecords.find(r => r.id === id)?.isReconciled
  )

  return { matched, unmatched, matchedRecordIds: Array.from(usedIds), newlyReconciledIds }
}

export default function ReconciliationPage() {
  const navigate = useNavigate()
  const [isMatching, setIsMatching] = useState(false)
  const [records, setRecords] = useState<AccountingRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [bankEntries, setBankEntries] = useState<BankEntry[]>([])
  const [lastImportResult, setLastImportResult] = useState<{ total: number; matched: number; unmatched: number } | null>(null)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [recognizingMessage, setRecognizingMessage] = useState('')

  useEffect(() => {
    accountingService.getAll().then(setRecords)
  }, [])

  const reconciled = records.filter((r) => r.isReconciled)
  const unreconciled = records.filter((r) => !r.isReconciled)
  const pct = records.length > 0 ? Math.round((reconciled.length / records.length) * 100) : 0

  const totalIncome = reconciled.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = reconciled.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)

  /** 处理导入的银行流水数据（来自Excel或OCR） */
  async function handleImportedBankData(entries: BankEntry[]) {
    if (entries.length === 0) {
      toast.warning('未解析到有效的流水记录')
      return
    }
    setIsMatching(true)
    setBankEntries(entries)

    try {
      const result = await matchBankEntries(entries, records)

      // 仅将新匹配到的未对账记录标记为已对账（已对账的不重复操作）
      const updated: AccountingRecord[] = []
      for (const id of result.newlyReconciledIds) {
        const u = await accountingService.update(id, { isReconciled: true })
        updated.push(u)
      }
      setRecords((prev) => prev.map((r) => updated.find((u) => u.id === r.id) || r))
      setBankEntries([...result.matched, ...result.unmatched])
      setLastImportResult({
        total: entries.length,
        matched: result.matched.length,
        unmatched: result.unmatched.length,
      })

      if (result.unmatched.length > 0) {
        toast.success(`匹配成功 ${result.matched.length} 笔，${result.unmatched.length} 笔未匹配（可能是漏记的交易）`)
      } else {
        toast.success(`全部 ${result.matched.length} 笔流水匹配成功，已自动标记为已对账`)
      }
    } catch (err) {
      toast.error(`匹配失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setIsMatching(false)
    }
  }

  async function handleAutoReconcile() {
    setIsMatching(true)
    await new Promise((res) => setTimeout(res, 1500))

    const updated: AccountingRecord[] = []
    for (const r of unreconciled) {
      const u = await accountingService.update(r.id, { isReconciled: true })
      updated.push(u)
    }
    setRecords((prev) => prev.map((r) => updated.find((u) => u.id === r.id) || r))
    setIsMatching(false)
    toast.success(`成功对账 ${updated.length} 笔记录`)
  }

  async function toggleReconcile(record: AccountingRecord) {
    const u = await accountingService.update(record.id, { isReconciled: !record.isReconciled })
    setRecords((prev) => prev.map((r) => (r.id === u.id ? u : r)))
    toast.success(u.isReconciled ? '已标记为已对账' : '已取消对账')
  }

  /** 将单条未匹配流水补录为记账记录 */
  async function handleCreateFromBankEntry(entry: BankEntry, index: number) {
    try {
      const newRecord = await accountingService.create({
        type: entry.type,
        amount: entry.amount,
        category: entry.type === 'income' ? '销售收入' : '其他支出',
        description: entry.description,
        date: entry.date,
        time: new Date().toTimeString().slice(0, 5),
        isReconciled: true,
        source: 'manual',
        tags: ['银行流水补录'],
      })
      setRecords((prev) => [...prev, newRecord])
      setBankEntries((prev) => prev.map((e, i) => i === index ? { ...e, matched: true } : e))
      setLastImportResult((prev) => prev ? {
        ...prev,
        matched: prev.matched + 1,
        unmatched: Math.max(0, prev.unmatched - 1),
      } : prev)
      toast.success(`已补录: ${entry.description} ${entry.type === 'income' ? '+' : '-'}${entry.amount}`)
    } catch (err) {
      toast.error(`补录失败: ${err instanceof Error ? err.message : '未知错误'}`)
    }
  }

  /** 批量补录所有未匹配流水 */
  async function handleBatchCreateFromBank() {
    const unmatchedEntries = bankEntries.map((e, i) => ({ entry: e, index: i })).filter(({ entry }) => !entry.matched)
    if (unmatchedEntries.length === 0) return

    let successCount = 0
    for (const { entry, index } of unmatchedEntries) {
      try {
        const newRecord = await accountingService.create({
          type: entry.type,
          amount: entry.amount,
          category: entry.type === 'income' ? '销售收入' : '其他支出',
          description: entry.description,
          date: entry.date,
          time: new Date().toTimeString().slice(0, 5),
          isReconciled: true,
          source: 'manual',
          tags: ['银行流水补录'],
        })
        setRecords((prev) => [...prev, newRecord])
        setBankEntries((prev) => prev.map((e, i) => i === index ? { ...e, matched: true } : e))
        successCount++
      } catch { /* skip failed */ }
    }
    setLastImportResult((prev) => prev ? {
      ...prev,
      matched: prev.matched + successCount,
      unmatched: Math.max(0, prev.unmatched - successCount),
    } : prev)
    toast.success(`已批量补录 ${successCount} 笔流水记录`)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-xl font-bold text-rich">对账中心</h1>
          <p className="text-sm text-muted-foreground">导入银行流水，自动匹配记账记录，确保账实一致</p>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(12 45% 42%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5 text-center">
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">总记录</p>
            <p className="stat-emboss mt-1 text-2xl font-bold">{records.length}</p>
          </CardContent>
        </Card>
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(152 55% 40%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5 text-center">
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">已对账</p>
            <p className="stat-emboss mt-1 text-2xl font-bold text-income">{reconciled.length}</p>
          </CardContent>
        </Card>
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(36 72% 52%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5 text-center">
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">未对账</p>
            <p className={cn('stat-emboss mt-1 text-2xl font-bold', unreconciled.length > 0 ? 'text-warning' : 'text-income')}>
              {unreconciled.length}
            </p>
          </CardContent>
        </Card>
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(195 55% 46%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5">
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase text-center">对账率</p>
            <p className="stat-emboss mt-1 text-2xl font-bold text-center">{pct}%</p>
            <Progress value={pct} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 导入 & 操作 */}
        <div className="flex flex-col gap-4">
          <Card className="card-premium relative overflow-hidden">
            {/* 识别中 loading overlay */}
            {isRecognizing && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur-sm rounded-xl">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
                <div className="text-center px-4">
                  <p className="text-sm font-semibold text-foreground">{recognizingMessage || '处理中...'}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">请勿关闭页面</p>
                </div>
                <div className="w-32 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm"><span className="section-label">银行流水导入</span></CardTitle>
              <CardDescription className="text-xs">拍照识别或上传Excel文件</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                id="photo-upload"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setIsRecognizing(true)
                  setRecognizingMessage('正在通过 AI 识别银行流水图片...')
                  try {
                    const { ocrService } = await import('@/services/ocr.service')
                    setRecognizingMessage('AI 模型分析中，请稍候...')
                    const data = await ocrService.recognizeBankStatement(file)
                    if (data.length > 0) {
                      setRecognizingMessage(`识别完成，正在匹配 ${data.length} 条流水...`)
                      await handleImportedBankData(data)
                    } else {
                      toast.warning('未能从图片中识别出流水记录，请确保图片清晰')
                    }
                  } catch (err) {
                    toast.error(`识别失败: ${err instanceof Error ? err.message : '未知错误'}`)
                  } finally {
                    setIsRecognizing(false)
                    setRecognizingMessage('')
                  }
                  e.target.value = ''
                }}
              />
              <Button variant="outline" className="w-full justify-start gap-2 text-xs" disabled={isRecognizing} onClick={() => document.getElementById('photo-upload')?.click()}>
                <Camera className="h-3.5 w-3.5" /> 拍照导入银行流水
              </Button>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                id="excel-upload"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setIsRecognizing(true)
                  setRecognizingMessage('正在解析 Excel 文件...')
                  try {
                    const data = await importExcelFile(file)
                    const entries = parseBankExcelData(data)
                    setRecognizingMessage(`解析完成，正在匹配 ${entries.length} 条流水...`)
                    await handleImportedBankData(entries)
                  } catch (err) {
                    toast.error(String(err))
                  } finally {
                    setIsRecognizing(false)
                    setRecognizingMessage('')
                  }
                  e.target.value = ''
                }}
              />
              <Button variant="outline" className="w-full justify-start gap-2 text-xs" disabled={isRecognizing} onClick={() => document.getElementById('excel-upload')?.click()}>
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel文件上传
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 text-xs" onClick={() => { try { exportAccountingRecords(records as unknown as Record<string, unknown>[], { isFiltered: false }); toast.success(`已导出全部 ${records.length} 条记账记录`) } catch { toast.error('导出失败') } }}>
                <ArrowDownRight className="h-3.5 w-3.5" /> 导出记账记录
              </Button>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <span className="section-label"><ShieldCheck className="h-3.5 w-3.5" /> 对账汇总</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-income" /> 已核实收入</span>
                <span className="font-mono font-semibold text-income">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-expense" /> 已核实支出</span>
                <span className="font-mono font-semibold text-expense">{formatCurrency(totalExpense)}</span>
              </div>
              <div className="gold-divider my-1" />
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-warning" /> 待核实笔数</span>
                <Badge variant={unreconciled.length > 0 ? 'destructive' : 'secondary'} className="text-[10px]">
                  {unreconciled.length} 笔
                </Badge>
              </div>

              <Button
                className="w-full mt-2"
                size="sm"
                disabled={isMatching || unreconciled.length === 0}
                onClick={handleAutoReconcile}
              >
                <RefreshCw className={cn('mr-2 h-3.5 w-3.5', isMatching && 'animate-spin')} />
                {isMatching ? '自动匹配中...' : `一键对账 (${unreconciled.length} 笔)`}
              </Button>
              {unreconciled.length > 0 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  提示：未匹配流水可能为漏记的收入/支出
                </p>
              )}
            </CardContent>
          </Card>

          {/* 导入结果 */}
          {lastImportResult && (
            <Card className="card-premium border-primary/20 flex-1 min-h-0 flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm"><span className="section-label">流水导入结果</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 min-h-0 flex flex-col">
                {/* 统计摘要 */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted/40 px-2.5 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground">总计</p>
                    <p className="text-sm font-bold font-mono">{lastImportResult.total}</p>
                  </div>
                  <div className="rounded-lg bg-income/5 px-2.5 py-2 text-center">
                    <p className="text-[10px] text-income">已匹配</p>
                    <p className="text-sm font-bold font-mono text-income">{lastImportResult.matched}</p>
                  </div>
                  <div className={cn('rounded-lg px-2.5 py-2 text-center', lastImportResult.unmatched > 0 ? 'bg-warning/5' : 'bg-muted/40')}>
                    <p className={cn('text-[10px]', lastImportResult.unmatched > 0 ? 'text-warning' : 'text-muted-foreground')}>未入账</p>
                    <p className={cn('text-sm font-bold font-mono', lastImportResult.unmatched > 0 ? 'text-warning' : 'text-muted-foreground')}>{lastImportResult.unmatched}</p>
                  </div>
                </div>

                {/* 未匹配条目批量操作 */}
                {bankEntries.filter(e => !e.matched).length > 0 && (
                  <div className="flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 gap-1 text-[10px] px-2"
                      onClick={handleBatchCreateFromBank}
                    >
                      <Plus className="h-3 w-3" /> 全部补录未入账
                    </Button>
                  </div>
                )}

                {/* 全部流水明细列表（自适应高度，滚动不穿透） */}
                <ScrollArea className="flex-1 min-h-[200px]">
                  <div className="space-y-1">
                    {bankEntries.map((entry, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-2.5 py-2 text-[11px] gap-2 transition-colors',
                          entry.matched ? 'bg-income/5' : 'bg-warning/5 border border-warning/20'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {entry.matched ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-income" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-warning" />
                          )}
                          <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded', entry.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
                            {entry.type === 'income' ? <ArrowUpRight className="h-2.5 w-2.5 text-income" /> : <ArrowDownRight className="h-2.5 w-2.5 text-expense" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{entry.description}</p>
                            <p className="text-[10px] text-muted-foreground">{entry.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn('font-mono font-semibold', entry.type === 'income' ? 'text-income' : 'text-expense')}>
                            {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                          </span>
                          {entry.matched ? (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-income/10 text-income border-0">已对照</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-5 px-1.5 text-[10px] text-primary hover:text-primary border-primary/30"
                              onClick={() => handleCreateFromBankEntry(entry, i)}
                            >
                              <Plus className="h-2.5 w-2.5 mr-0.5" />补录
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {bankEntries.filter(e => !e.matched).length > 0 && (
                  <p className="text-[10px] text-muted-foreground">标记为「未入账」的流水在记账记录中未找到匹配，点击「补录」自动创建记账记录</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 记录列表 */}
        <div className="lg:col-span-2">
          <Card className="card-premium">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm"><span className="section-label">记账记录对账状态</span></CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="搜索..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })) }}
                      className="h-7 w-36 pl-7 text-xs"
                    />
                  </div>
                  <div className="flex gap-1.5 text-[11px]">
                    <span className="flex items-center gap-1 text-income"><CheckCircle2 className="h-3 w-3" /> 已对账</span>
                    <span className="flex items-center gap-1 text-warning"><XCircle className="h-3 w-3" /> 未对账</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const sortedRecords = records
                  .filter(r => !searchQuery || r.description.toLowerCase().includes(searchQuery.toLowerCase()) || r.category.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                const paged = paginateData(sortedRecords, pagination)
                return (
                  <>
                    <div className="space-y-1">
                      {paged.map((record) => (
                        <div
                          key={record.id}
                          className={cn(
                            'list-item-refined flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer',
                            record.isReconciled ? '' : 'bg-warning/5'
                          )}
                          onClick={() => toggleReconcile(record)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {record.isReconciled ? (
                              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-income" />
                            ) : (
                              <XCircle className="h-4.5 w-4.5 shrink-0 text-warning" />
                            )}
                            <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', record.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
                              {record.type === 'income' ? <ArrowUpRight className="h-3.5 w-3.5 text-income" /> : <ArrowDownRight className="h-3.5 w-3.5 text-expense" />}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-foreground">{record.description}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`inline-flex items-center rounded px-1.5 py-0 text-[10px] font-medium ${getCategoryColorClass(record.category)}`}>{record.category}</span>
                                <span className="text-[11px] text-muted-foreground">{record.date} {record.time || ''}</span>
                              </div>
                            </div>
                          </div>
                          <span className={cn('amount-display shrink-0 font-mono text-sm font-bold', record.type === 'income' ? 'text-income' : 'text-expense')}>
                            {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                          </span>
                        </div>
                      ))}
                      {sortedRecords.length === 0 && (
                        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">暂无记账记录</div>
                      )}
                    </div>
                    {sortedRecords.length > 0 && (
                      <DataTablePagination
                        totalItems={sortedRecords.length}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                      />
                    )}
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
