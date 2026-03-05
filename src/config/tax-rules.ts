import type { TaxConfig, TaxType, DeclarationPeriod, DeclarationStep } from '@/types/tax'

export const TAX_CONFIGS: Record<string, TaxConfig> = {
  individual: {
    businessType: 'individual',
    applicableTaxes: ['vat', 'income_tax'],
    vatThreshold: 100000,
    vatRate: 0.01,
    incomeTaxRate: 0.05,
  },
  small_taxpayer: {
    businessType: 'small_taxpayer',
    applicableTaxes: ['vat', 'corporate_tax'],
    vatThreshold: 100000,
    vatRate: 0.01,
    incomeTaxRate: 0.05,
  },
}

export const TAX_TYPE_LABELS: Record<TaxType, string> = {
  vat: '增值税',
  income_tax: '个人所得税',
  corporate_tax: '企业所得税',
}

export const TAX_PERIOD_CONFIG: Record<TaxType, { period: DeclarationPeriod; label: string }> = {
  vat: { period: 'quarterly', label: '按季申报' },
  income_tax: { period: 'quarterly', label: '按季预缴' },
  corporate_tax: { period: 'quarterly', label: '按季预缴' },
}

export const VAT_EXEMPTION_RULES = [
  {
    condition: 'monthly_sales_under_100k',
    threshold: 100000,
    description: '小规模纳税人月销售额10万元以下免征增值税',
    effectiveDate: '2023-01-01',
  },
  {
    condition: 'quarterly_sales_under_300k',
    threshold: 300000,
    description: '小规模纳税人季度销售额30万元以下免征增值税',
    effectiveDate: '2023-01-01',
  },
]

export const DECLARATION_STEPS: Record<TaxType, DeclarationStep[]> = {
  vat: [
    { step: 1, title: '登录电子税务局', description: '打开当地电子税务局网站，使用法人或财务负责人账号登录', isCompleted: false },
    { step: 2, title: '进入申报模块', description: '在首页找到"我要办税" → "税费申报及缴纳"', isCompleted: false },
    { step: 3, title: '选择增值税申报', description: '点击"增值税及附加税费申报（小规模纳税人适用）"', isCompleted: false },
    { step: 4, title: '导入申报数据', description: '将本系统生成的申报表数据填入对应栏位，注意核对免税销售额', isCompleted: false },
    { step: 5, title: '提交申报', description: '核对无误后点击"提交申报"，保存申报回执', isCompleted: false },
  ],
  income_tax: [
    { step: 1, title: '登录自然人电子税务局', description: '打开自然人电子税务局网站或APP', isCompleted: false },
    { step: 2, title: '进入经营所得申报', description: '选择"经营所得" → "预缴纳税申报"', isCompleted: false },
    { step: 3, title: '填写收入信息', description: '录入本期营业收入、成本费用等数据', isCompleted: false },
    { step: 4, title: '确认税款', description: '系统自动计算应纳税额，核对后提交', isCompleted: false },
  ],
  corporate_tax: [
    { step: 1, title: '登录电子税务局', description: '使用企业账号登录当地电子税务局', isCompleted: false },
    { step: 2, title: '进入企业所得税申报', description: '找到"企业所得税预缴申报"入口', isCompleted: false },
    { step: 3, title: '填写季度数据', description: '录入本季度营业收入、营业成本、利润总额', isCompleted: false },
    { step: 4, title: '提交申报', description: '核对应纳税所得额和税款后提交', isCompleted: false },
  ],
}

export function getQuarterDates(date: Date): { start: string; end: string } {
  const quarter = Math.floor(date.getMonth() / 3)
  const year = date.getFullYear()
  const startMonth = quarter * 3
  const endMonth = startMonth + 2

  const start = new Date(year, startMonth, 1)
  const end = new Date(year, endMonth + 1, 0)

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function getNextDeclarationDueDate(taxType: TaxType, fromDate: Date = new Date()): Date {
  const config = TAX_PERIOD_CONFIG[taxType]
  const year = fromDate.getFullYear()
  const month = fromDate.getMonth()

  if (config.period === 'quarterly') {
    const currentQuarter = Math.floor(month / 3)
    const nextQuarterFirstMonth = (currentQuarter + 1) * 3
    const dueDate = new Date(year, nextQuarterFirstMonth, 15)
    if (dueDate <= fromDate) {
      dueDate.setMonth(dueDate.getMonth() + 3)
    }
    return dueDate
  }

  if (config.period === 'monthly') {
    const dueDate = new Date(year, month + 1, 15)
    if (dueDate <= fromDate) {
      dueDate.setMonth(dueDate.getMonth() + 1)
    }
    return dueDate
  }

  return new Date(year + 1, 4, 31)
}
