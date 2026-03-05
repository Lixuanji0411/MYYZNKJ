export type ReportType = 'daily' | 'monthly' | 'tax_summary'

export interface DailyReport {
  date: string
  totalIncome: number
  totalExpense: number
  netProfit: number
  records: Array<{
    id: string
    type: 'income' | 'expense'
    amount: number
    category: string
    description: string
    time: string
  }>
}

export interface MonthlyReport {
  month: string
  totalIncome: number
  totalExpense: number
  netProfit: number
  profitChange: number
  profitChangePercent: number
  incomeByCategory: Array<{ category: string; amount: number; percent: number }>
  expenseByCategory: Array<{ category: string; amount: number; percent: number }>
  dailyIncome: Array<{ date: string; amount: number }>
  dailyExpense: Array<{ date: string; amount: number }>
  topProducts?: Array<{ name: string; quantity: number; revenue: number }>
  summary: string
}

export interface TaxSummaryReport {
  period: string
  periodStart: string
  periodEnd: string
  totalSales: number
  totalCost: number
  grossProfit: number
  taxableIncome: number
  vatAmount: number
  incomeTaxAmount: number
  isVatExempt: boolean
  exemptReason?: string
  highlights: Array<{
    label: string
    value: number
    isHighlighted: boolean
    note?: string
  }>
}

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface TrendDataPoint {
  date: string
  income: number
  expense: number
  profit: number
}
