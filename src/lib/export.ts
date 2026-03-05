import * as XLSX from 'xlsx'

interface ExportColumn {
  header: string
  key: string
  width?: number
}

export function exportToExcel(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string,
  sheetName = 'Sheet1'
) {
  const headers = columns.map((c) => c.header)
  const rows = data.map((item) =>
    columns.map((c) => {
      const val = item[c.key]
      if (val === null || val === undefined) return ''
      return val
    })
  )

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  const colWidths = columns.map((c) => ({ wch: c.width || 16 }))
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/** 导出筛选选项（用于智能命名） */
export interface ExportFilterOptions {
  typeFilter?: string    // 'all' | 'income' | 'expense'
  categoryFilter?: string // 'all' | 具体分类名
  dateFilter?: string     // YYYY-MM-DD
  searchQuery?: string
  isFiltered?: boolean    // 是否为筛选导出（否则为全部导出）
}

/** 根据筛选条件生成智能文件名 */
function buildSmartFilename(baseName: string, options?: ExportFilterOptions): string {
  const now = new Date().toISOString().split('T')[0]
  const parts: string[] = [baseName]

  if (options?.isFiltered) {
    // 类型标签
    if (options.typeFilter && options.typeFilter !== 'all') {
      parts.push(options.typeFilter === 'income' ? '收入' : '支出')
    } else {
      parts.push('收入与支出')
    }
    // 分类标签
    if (options.categoryFilter && options.categoryFilter !== 'all') {
      parts.push(options.categoryFilter)
    }
    // 日期标签
    if (options.dateFilter) {
      parts.push(options.dateFilter)
    }
    // 搜索关键词
    if (options.searchQuery) {
      parts.push(options.searchQuery.slice(0, 10))
    }
  } else {
    parts.push('全部')
  }

  parts.push(now)
  return parts.join('_')
}

export function exportAccountingRecords(records: Record<string, unknown>[], filterOptions?: ExportFilterOptions) {
  const columns: ExportColumn[] = [
    { header: '日期', key: 'date', width: 12 },
    { header: '时间', key: 'time', width: 8 },
    { header: '类型', key: 'typeLabel', width: 8 },
    { header: '金额', key: 'amount', width: 14 },
    { header: '分类', key: 'category', width: 14 },
    { header: '描述', key: 'description', width: 28 },
    { header: '对账状态', key: 'reconciledLabel', width: 10 },
    { header: '来源', key: 'source', width: 10 },
  ]

  const sourceMap: Record<string, string> = {
    manual: '手动',
    voice: '语音',
    photo: '拍照',
    template: '模板',
    inventory: '库存',
    'ai-chat': 'AI对话',
  }

  const mapped = records.map((r) => ({
    ...r,
    typeLabel: r.type === 'income' ? '收入' : '支出',
    reconciledLabel: r.isReconciled ? '已对账' : '未对账',
    source: sourceMap[r.source as string] || r.source || '手动',
  }))

  const filename = buildSmartFilename('记账记录', filterOptions)
  exportToExcel(mapped, columns, filename, '记账记录')
}

export function exportTaxDeclaration(declaration: Record<string, unknown>) {
  const rows = [
    { item: '税种', value: declaration.taxType === 'vat' ? '增值税' : '个人所得税(经营所得)' },
    { item: '申报期间', value: `${declaration.periodStart} ~ ${declaration.periodEnd}` },
    { item: '销售额', value: declaration.salesAmount },
    { item: '成本费用', value: declaration.costAmount },
    { item: '应税金额', value: declaration.taxableAmount },
    { item: '应纳税额', value: declaration.taxAmount },
    { item: '是否免税', value: declaration.isExempt ? '是' : '否' },
    { item: '免税金额', value: declaration.exemptAmount || 0 },
    { item: '免税原因', value: declaration.exemptReason || '' },
    { item: '生成时间', value: declaration.generatedAt },
  ]

  const columns: ExportColumn[] = [
    { header: '项目', key: 'item', width: 18 },
    { header: '数值', key: 'value', width: 30 },
  ]

  const taxLabel = declaration.taxType === 'vat' ? '增值税' : '所得税'
  const now = new Date().toISOString().split('T')[0]
  exportToExcel(rows, columns, `${taxLabel}申报表_${now}`, '申报表')
}

export function exportTaxSummary(report: Record<string, unknown>) {
  const rows = [
    { item: '申报期间', value: report.period },
    { item: '销售总额', value: report.totalSales },
    { item: '成本费用', value: report.totalCost },
    { item: '毛利润', value: report.grossProfit },
    { item: '是否免征增值税', value: report.isVatExempt ? '是(季度销售额<30万)' : '否' },
    { item: '应纳增值税', value: report.vatAmount },
    { item: '应纳所得税', value: report.incomeTaxAmount },
  ]

  const columns: ExportColumn[] = [
    { header: '项目', key: 'item', width: 20 },
    { header: '数值', key: 'value', width: 30 },
  ]

  const now = new Date().toISOString().split('T')[0]
  exportToExcel(rows, columns, `报税汇总_${now}`, '报税汇总')
}

export function importExcelFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const firstSheet = wb.Sheets[wb.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[]
        resolve(jsonData)
      } catch (err) {
        reject(new Error('Excel 文件解析失败: ' + String(err)))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}
