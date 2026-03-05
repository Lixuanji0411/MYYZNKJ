import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, TrendingUp, TrendingDown, Download, CalendarDays, Clock, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { accountingService } from '@/services/accounting.service'
import { formatCurrency } from '@/lib/format'
import { exportAccountingRecords, type ExportFilterOptions } from '@/lib/export'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { DataTablePagination, paginateData, type PaginationState } from '@/components/shared/data-table-pagination'
import type { AccountingRecord } from '@/types/accounting'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { getCategoryColorClass } from '@/lib/category-colors'
import { zhCN } from 'date-fns/locale'

function formatDateLabel(dateStr: string): string {
  try {
    const d = parseISO(dateStr + 'T00:00:00')
    if (isToday(d)) return '今天'
    if (isYesterday(d)) return '昨天'
    return format(d, 'M月d日 EEEE', { locale: zhCN })
  } catch {
    return dateStr
  }
}

function getRecordTime(record: AccountingRecord): string {
  if (record.time) return record.time
  // 从createdAt提取时间作为兼容
  try {
    return format(parseISO(record.createdAt), 'HH:mm')
  } catch {
    return '--:--'
  }
}

const SOURCE_LABELS: Record<string, string> = {
  manual: '手动',
  photo: '拍照',
  voice: '语音',
  template: '模板',
  inventory: '库存',
  'ai-chat': 'AI对话',
}

export default function AccountingPage() {
  const [records, setRecords] = useState<AccountingRecord[]>([])
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [activeTab, setActiveTab] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  useEffect(() => {
    async function loadRecords() {
      const all = await accountingService.getAll()
      setRecords(all.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date)
        if (dateCompare !== 0) return dateCompare
        const timeA = a.time || '00:00'
        const timeB = b.time || '00:00'
        return timeB.localeCompare(timeA)
      }))
    }
    loadRecords()
  }, [])

  // 获取所有分类用于筛选下拉
  const allCategories = useMemo(() => {
    const cats = new Set(records.map((r) => r.category))
    return Array.from(cats).sort()
  }, [records])

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch = !searchQuery ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.linkedProductName && r.linkedProductName.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesTab = activeTab === 'all' || r.type === activeTab
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter
      const matchesDate = !dateFilter || r.date === dateFilter
      return matchesSearch && matchesTab && matchesCategory && matchesDate
    })
  }, [records, searchQuery, activeTab, categoryFilter, dateFilter])

  // 分页后的数据
  const paginatedRecords = paginateData(filteredRecords, pagination)

  // 按日期分组（分页后的数据）
  const groupedByDate = useMemo(() => {
    const groups: Array<{ date: string; label: string; records: AccountingRecord[]; dayIncome: number; dayExpense: number }> = []
    const dateMap = new Map<string, AccountingRecord[]>()

    for (const r of paginatedRecords) {
      const d = r.date
      if (!dateMap.has(d)) dateMap.set(d, [])
      dateMap.get(d)!.push(r)
    }

    for (const [date, recs] of dateMap) {
      groups.push({
        date,
        label: formatDateLabel(date),
        records: recs,
        dayIncome: recs.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0),
        dayExpense: recs.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0),
      })
    }

    return groups
  }, [paginatedRecords])

  // 重置分页到第一页当筛选条件变化
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [searchQuery, activeTab, categoryFilter, dateFilter])

  const totalIncome = records.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = records.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="font-display text-2xl font-bold text-rich">智能记账</h1>
          <p className="mt-1 text-sm text-muted-foreground">管理您的收支记录</p>
        </div>
        <div className="action-bar">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Download className="mr-1 h-3.5 w-3.5" /> 导出
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                try {
                  exportAccountingRecords(records as unknown as Record<string, unknown>[])
                  toast.success(`已导出全部 ${records.length} 条记录`)
                } catch { toast.error('导出失败') }
              }}>
                导出全部 ({records.length} 条)
              </DropdownMenuItem>
              {(activeTab !== 'all' || categoryFilter !== 'all' || dateFilter || searchQuery) && (
                <DropdownMenuItem onClick={() => {
                  try {
                    const opts: ExportFilterOptions = {
                      isFiltered: true,
                      typeFilter: activeTab,
                      categoryFilter,
                      dateFilter,
                      searchQuery,
                    }
                    exportAccountingRecords(filteredRecords as unknown as Record<string, unknown>[], opts)
                    toast.success(`已导出筛选结果 ${filteredRecords.length} 条记录`)
                  } catch { toast.error('导出失败') }
                }}>
                  导出筛选结果 ({filteredRecords.length} 条)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/accounting/reconciliation">
            <Button variant="ghost" size="sm">对账中心</Button>
          </Link>
          <Link to="/accounting/new">
            <Button size="sm" className="rounded-lg">
              <Plus className="mr-1 h-4 w-4" /> 新建记录
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(152 55% 40%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5">
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">总收入</p>
            <p className="stat-emboss mt-1 text-xl font-bold text-income">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(0 65% 50%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5">
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">总支出</p>
            <p className="stat-emboss mt-1 text-xl font-bold text-expense">{formatCurrency(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(12 45% 42%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5">
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">净利润</p>
            <p className={`stat-emboss mt-1 text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-premium">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base"><span className="section-label">全部记录</span></CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索描述/分类/商品..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-52 pl-8 text-sm"
                />
              </div>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-8 w-36 text-sm"
                title="按日期筛选"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <Filter className="mr-1 h-3 w-3" />
                  <SelectValue placeholder="分类筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">全部分类</SelectItem>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchQuery || dateFilter || categoryFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => { setSearchQuery(''); setDateFilter(''); setCategoryFilter('all') }}
                >
                  清除筛选
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">全部 ({records.length})</TabsTrigger>
              <TabsTrigger value="income">收入 ({records.filter(r => r.type === 'income').length})</TabsTrigger>
              <TabsTrigger value="expense">支出 ({records.filter(r => r.type === 'expense').length})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {groupedByDate.length > 0 ? (
              <div className="space-y-5">
                {groupedByDate.map((group) => (
                  <div key={group.date}>
                    {/* 日期分组头 */}
                    <div className="flex items-center justify-between mb-2.5 px-1">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">{group.label}</span>
                        <span className="text-xs text-muted-foreground font-mono">{group.date}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        {group.dayIncome > 0 && (
                          <span className="text-income font-mono">+{formatCurrency(group.dayIncome)}</span>
                        )}
                        {group.dayExpense > 0 && (
                          <span className="text-expense font-mono">-{formatCurrency(group.dayExpense)}</span>
                        )}
                      </div>
                    </div>

                    {/* 专业表格 */}
                    <div className="rounded-lg border border-border/40 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/40">
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground/80 w-[72px]">时间</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground/80 w-14">类型</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground/80">描述</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground/80 w-28">分类</th>
                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground/80 w-32">金额</th>
                            <th className="hidden sm:table-cell px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground/80 w-16">来源</th>
                            <th className="hidden sm:table-cell px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground/80 w-14">对账</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.records.map((record, idx) => (
                            <tr
                              key={record.id}
                              className={`border-b border-border/20 transition-colors hover:bg-muted/20 ${idx === group.records.length - 1 ? 'border-b-0' : ''}`}
                            >
                              <td className="px-3 py-3">
                                <span className="flex items-center gap-1 text-xs text-foreground/60 font-mono">
                                  <Clock className="h-3 w-3" />
                                  {getRecordTime(record)}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${record.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                  {record.type === 'income' ? <TrendingUp className="h-3.5 w-3.5 text-income" /> : <TrendingDown className="h-3.5 w-3.5 text-expense" />}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <p className="text-[13px] font-semibold text-foreground truncate max-w-[220px]">{record.description}</p>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getCategoryColorClass(record.category)}`}>
                                  {record.category}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right">
                                <span className={`font-mono text-[15px] font-bold tracking-tight ${record.type === 'income' ? 'text-income' : 'text-expense'}`}>
                                  {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                                </span>
                              </td>
                              <td className="hidden sm:table-cell px-3 py-3 text-center">
                                <span className="text-xs text-muted-foreground">{SOURCE_LABELS[record.source] || record.source}</span>
                              </td>
                              <td className="hidden sm:table-cell px-3 py-3 text-center">
                                <span className={`inline-block h-2.5 w-2.5 rounded-full ${record.isReconciled ? 'bg-income' : 'bg-warning'}`} title={record.isReconciled ? '已对账' : '未对账'} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                {searchQuery || dateFilter || categoryFilter !== 'all' ? '未找到匹配的记录' : '暂无记录，点击右上角「新建记录」开始记账'}
              </div>
            )}

            {/* 专业分页 */}
            {filteredRecords.length > 0 && (
              <DataTablePagination
                totalItems={filteredRecords.length}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
