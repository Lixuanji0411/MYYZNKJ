import type { TaxDeclaration, TaxReminder, TaxConfig } from '@/types/tax'
import { LocalStorageService } from './base.service'
import { getItem, setItem } from './storage'
import { TAX_CONFIGS, TAX_TYPE_LABELS, TAX_PERIOD_CONFIG, getNextDeclarationDueDate } from '@/config/tax-rules'
import { accountingService } from './accounting.service'

const TAX_CONFIG_KEY = 'tax_config'

class TaxDeclarationService extends LocalStorageService<TaxDeclaration> {
  constructor() {
    super('tax_declarations')
  }

  getTaxConfig(businessType: string): TaxConfig {
    const savedConfig = getItem<TaxConfig>(TAX_CONFIG_KEY)
    if (savedConfig) return savedConfig

    return TAX_CONFIGS[businessType] || TAX_CONFIGS['individual']
  }

  saveTaxConfig(config: TaxConfig): void {
    setItem(TAX_CONFIG_KEY, config)
  }

  async getReminders(businessType: string): Promise<TaxReminder[]> {
    const config = this.getTaxConfig(businessType)
    const now = new Date()

    return config.applicableTaxes.map((taxType) => {
      const dueDate = getNextDeclarationDueDate(taxType, now)
      const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const periodConfig = TAX_PERIOD_CONFIG[taxType]

      let status: 'upcoming' | 'urgent' | 'overdue' = 'upcoming'
      if (daysRemaining <= 0) status = 'overdue'
      else if (daysRemaining <= 7) status = 'urgent'

      return {
        id: `reminder_${taxType}`,
        taxType,
        dueDate: dueDate.toISOString().split('T')[0],
        daysRemaining: Math.max(0, daysRemaining),
        period: periodConfig.period,
        periodLabel: `${TAX_TYPE_LABELS[taxType]} - ${periodConfig.label}`,
        status,
      }
    })
  }

  async generateDeclaration(
    taxType: 'vat' | 'income_tax' | 'corporate_tax',
    periodStart: string,
    periodEnd: string,
    businessType: string
  ): Promise<TaxDeclaration> {
    const config = this.getTaxConfig(businessType)
    const records = await accountingService.getByDateRange(periodStart, periodEnd)

    const salesAmount = records
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0)

    const costAmount = records
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0)

    let taxableAmount = 0
    let taxAmount = 0
    let isExempt = false
    let exemptReason: string | undefined
    let exemptAmount = 0

    if (taxType === 'vat') {
      taxableAmount = salesAmount
      if (salesAmount <= config.vatThreshold * 3) {
        isExempt = true
        exemptAmount = salesAmount
        exemptReason = '小规模纳税人季度销售额30万元以下免征增值税'
        taxAmount = 0
      } else {
        taxAmount = salesAmount * config.vatRate
      }
    } else {
      const profit = salesAmount - costAmount
      taxableAmount = Math.max(0, profit)
      taxAmount = taxableAmount * config.incomeTaxRate
    }

    const periodConfig = TAX_PERIOD_CONFIG[taxType]
    const dueDate = getNextDeclarationDueDate(taxType)

    return this.create({
      taxType,
      period: periodConfig.period,
      periodStart,
      periodEnd,
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'generated',
      salesAmount,
      costAmount,
      taxableAmount,
      taxAmount,
      exemptAmount,
      isExempt,
      exemptReason,
      generatedAt: new Date().toISOString(),
    })
  }
}

export const taxService = new TaxDeclarationService()
