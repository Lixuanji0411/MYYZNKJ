import type { AccountingRecord, CategoryMapping } from '@/types/accounting'
import { LocalStorageService } from './base.service'
import { getItem, setItem } from './storage'
import { matchCategory } from '@/config/categories'

const CUSTOM_MAPPINGS_KEY = 'custom_category_mappings'

class AccountingService extends LocalStorageService<AccountingRecord> {
  constructor() {
    super('accounting_records')
  }

  async getByDateRange(startDate: string, endDate: string): Promise<AccountingRecord[]> {
    const all = await this.getAll()
    return all.filter((r) => r.date >= startDate && r.date <= endDate)
  }

  async getByType(type: 'income' | 'expense'): Promise<AccountingRecord[]> {
    return this.getAll({ type })
  }

  async getByCategory(category: string): Promise<AccountingRecord[]> {
    return this.getAll({ category })
  }

  async getTodaySummary(): Promise<{ income: number; expense: number; profit: number; count: number }> {
    const today = new Date().toISOString().split('T')[0]
    const records = await this.getByDateRange(today, today)

    const income = records
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0)
    const expense = records
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0)

    return { income, expense, profit: income - expense, count: records.length }
  }

  async getMonthSummary(year: number, month: number): Promise<{ income: number; expense: number; profit: number }> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const records = await this.getByDateRange(startDate, endDate)

    const income = records
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0)
    const expense = records
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0)

    return { income, expense, profit: income - expense }
  }

  async getRecentRecords(limit: number = 10): Promise<AccountingRecord[]> {
    const all = await this.getAll()
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)
  }

  autoClassify(description: string): { category: string; subcategory?: string; type: 'income' | 'expense'; confidence: number } | null {
    const customMappings = getItem<CategoryMapping[]>(CUSTOM_MAPPINGS_KEY) || []
    return matchCategory(description, customMappings)
  }

  async updateCategoryMapping(keyword: string, category: string, type: 'income' | 'expense', subcategory?: string): Promise<void> {
    const customMappings = getItem<CategoryMapping[]>(CUSTOM_MAPPINGS_KEY) || []

    const existingIndex = customMappings.findIndex((m) => m.keyword === keyword)
    if (existingIndex !== -1) {
      customMappings[existingIndex].category = category
      customMappings[existingIndex].weight = Math.min(customMappings[existingIndex].weight + 1, 15)
      if (subcategory) customMappings[existingIndex].subcategory = subcategory
    } else {
      customMappings.push({ keyword, category, subcategory, type, weight: 11 })
    }

    setItem(CUSTOM_MAPPINGS_KEY, customMappings)
  }

  async searchRecords(query: string): Promise<AccountingRecord[]> {
    const all = await this.getAll()
    const q = query.toLowerCase()
    return all.filter(
      (r) =>
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.tags && r.tags.some((t) => t.toLowerCase().includes(q))) ||
        (r.linkedProductName && r.linkedProductName.toLowerCase().includes(q))
    )
  }

  async getExpenseByCategory(startDate: string, endDate: string): Promise<Array<{ category: string; amount: number; percent: number }>> {
    const records = await this.getByDateRange(startDate, endDate)
    const expenses = records.filter((r) => r.type === 'expense')
    const total = expenses.reduce((sum, r) => sum + r.amount, 0)

    const grouped = expenses.reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + r.amount
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }
}

export const accountingService = new AccountingService()
