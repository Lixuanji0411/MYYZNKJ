import type { DailyReport, MonthlyReport, TaxSummaryReport } from '@/types/report'
import { accountingService } from './accounting.service'
import { format, subMonths, eachDayOfInterval, parseISO } from 'date-fns'

export const reportService = {
  async getDailyReport(date: string): Promise<DailyReport> {
    const records = await accountingService.getByDateRange(date, date)

    const totalIncome = records
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0)
    const totalExpense = records
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0)

    return {
      date,
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      records: records
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((r) => ({
          id: r.id,
          type: r.type,
          amount: r.amount,
          category: r.category,
          description: r.description,
          time: r.createdAt,
        })),
    }
  },

  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    const startDate = `${monthStr}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`

    const records = await accountingService.getByDateRange(startDate, endDate)

    const totalIncome = records
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0)
    const totalExpense = records
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0)
    const netProfit = totalIncome - totalExpense

    const prevMonth = subMonths(new Date(year, month - 1, 1), 1)
    const prevSummary = await accountingService.getMonthSummary(
      prevMonth.getFullYear(),
      prevMonth.getMonth() + 1
    )
    const profitChange = netProfit - prevSummary.profit
    const profitChangePercent =
      prevSummary.profit !== 0
        ? Math.round((profitChange / Math.abs(prevSummary.profit)) * 100)
        : netProfit > 0
          ? 100
          : 0

    const incomeByCategory = records
      .filter((r) => r.type === 'income')
      .reduce<Record<string, number>>((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + r.amount
        return acc
      }, {})

    const expenseByCategory = records
      .filter((r) => r.type === 'expense')
      .reduce<Record<string, number>>((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + r.amount
        return acc
      }, {})

    const start = parseISO(startDate)
    const end = parseISO(endDate)
    const days = eachDayOfInterval({ start, end })

    const dailyIncome = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayRecords = records.filter((r) => r.date === dayStr && r.type === 'income')
      return { date: dayStr, amount: dayRecords.reduce((sum, r) => sum + r.amount, 0) }
    })

    const dailyExpense = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayRecords = records.filter((r) => r.date === dayStr && r.type === 'expense')
      return { date: dayStr, amount: dayRecords.reduce((sum, r) => sum + r.amount, 0) }
    })

    const summary = generateMonthlySummary(totalIncome, totalExpense, netProfit, profitChange, expenseByCategory)

    return {
      month: monthStr,
      totalIncome,
      totalExpense,
      netProfit,
      profitChange,
      profitChangePercent,
      incomeByCategory: Object.entries(incomeByCategory).map(([category, amount]) => ({
        category,
        amount,
        percent: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
      })),
      expenseByCategory: Object.entries(expenseByCategory).map(([category, amount]) => ({
        category,
        amount,
        percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      })),
      dailyIncome,
      dailyExpense,
      summary,
    }
  },

  async getTaxSummaryReport(periodStart: string, periodEnd: string): Promise<TaxSummaryReport> {
    const records = await accountingService.getByDateRange(periodStart, periodEnd)

    const totalSales = records
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0)
    const totalCost = records
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0)
    const grossProfit = totalSales - totalCost

    const isVatExempt = totalSales <= 300000
    const vatAmount = isVatExempt ? 0 : totalSales * 0.01
    const taxableIncome = Math.max(0, grossProfit)
    const incomeTaxAmount = taxableIncome * 0.05

    return {
      period: `${periodStart} ~ ${periodEnd}`,
      periodStart,
      periodEnd,
      totalSales,
      totalCost,
      grossProfit,
      taxableIncome,
      vatAmount,
      incomeTaxAmount,
      isVatExempt,
      exemptReason: isVatExempt ? '季度销售额30万元以下免征增值税' : undefined,
      highlights: [
        { label: '销售额', value: totalSales, isHighlighted: false },
        { label: '免税销售额', value: isVatExempt ? totalSales : 0, isHighlighted: true, note: '此项需填入申报表对应栏位' },
        { label: '应税销售额', value: isVatExempt ? 0 : totalSales, isHighlighted: true },
        { label: '成本费用', value: totalCost, isHighlighted: false },
        { label: '应纳增值税', value: vatAmount, isHighlighted: true, note: isVatExempt ? '免税' : undefined },
        { label: '应纳所得税', value: incomeTaxAmount, isHighlighted: true },
      ],
    }
  },

  async getIncomeTrend(months: number = 3): Promise<Array<{ month: string; income: number; expense: number; profit: number }>> {
    const now = new Date()
    const result: Array<{ month: string; income: number; expense: number; profit: number }> = []

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const summary = await accountingService.getMonthSummary(year, month)

      result.push({
        month: format(date, 'yyyy-MM'),
        income: summary.income,
        expense: summary.expense,
        profit: summary.profit,
      })
    }

    return result
  },
}

function generateMonthlySummary(
  _income: number,
  expense: number,
  profit: number,
  profitChange: number,
  expenseByCategory: Record<string, number>
): string {
  const parts: string[] = []

  if (profit >= 0) {
    parts.push(`本月净利润${formatCurrency(profit)}元`)
  } else {
    parts.push(`本月亏损${formatCurrency(Math.abs(profit))}元`)
  }

  if (profitChange > 0) {
    parts.push(`比上月增加${formatCurrency(profitChange)}元`)
  } else if (profitChange < 0) {
    parts.push(`比上月减少${formatCurrency(Math.abs(profitChange))}元`)
  }

  const topExpense = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])
  if (topExpense.length > 0) {
    const [category, amount] = topExpense[0]
    const percent = expense > 0 ? Math.round((amount / expense) * 100) : 0
    parts.push(`最大支出项为「${category}」，占总支出${percent}%`)
  }

  return parts.join('，') + '。'
}

function formatCurrency(value: number): string {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
