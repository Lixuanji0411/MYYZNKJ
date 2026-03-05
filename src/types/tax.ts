export type TaxType = 'vat' | 'income_tax' | 'corporate_tax'
export type DeclarationPeriod = 'monthly' | 'quarterly' | 'annually'
export type DeclarationStatus = 'pending' | 'generated' | 'submitted' | 'completed'

export interface TaxConfig {
  businessType: 'individual' | 'small_taxpayer'
  applicableTaxes: TaxType[]
  vatThreshold: number
  vatRate: number
  incomeTaxRate: number
  region?: string
}

export interface TaxDeclaration {
  id: string
  taxType: TaxType
  period: DeclarationPeriod
  periodStart: string
  periodEnd: string
  dueDate: string
  status: DeclarationStatus
  salesAmount: number
  costAmount: number
  taxableAmount: number
  taxAmount: number
  exemptAmount: number
  isExempt: boolean
  exemptReason?: string
  generatedAt?: string
  submittedAt?: string
  createdAt: string
  updatedAt: string
}

export interface TaxReminder {
  id: string
  taxType: TaxType
  dueDate: string
  daysRemaining: number
  period: DeclarationPeriod
  periodLabel: string
  status: 'upcoming' | 'urgent' | 'overdue'
}

export interface TaxPlatformCredentials {
  platform: string
  username: string
  loginUrl: string
  lastSync?: string
}

export interface DeclarationStep {
  step: number
  title: string
  description: string
  isCompleted: boolean
}
