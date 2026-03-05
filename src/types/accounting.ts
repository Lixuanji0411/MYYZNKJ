export type RecordType = 'income' | 'expense'
export type RecordSource = 'manual' | 'photo' | 'voice' | 'template' | 'inventory' | 'ai-chat'

export interface AccountingRecord {
  id: string
  type: RecordType
  amount: number
  category: string
  subcategory?: string
  description: string
  date: string
  time: string
  source: RecordSource
  attachments?: string[]
  tags?: string[]
  linkedInventoryId?: string
  linkedProductName?: string
  quantity?: number
  unitPrice?: number
  isReconciled: boolean
  reconciledFlowId?: string
  createdAt: string
  updatedAt: string
}

export interface CategoryMapping {
  keyword: string
  category: string
  subcategory?: string
  type: RecordType
  weight: number
}

export interface ReconciliationFlow {
  id: string
  date: string
  amount: number
  type: RecordType
  counterparty?: string
  description?: string
  source: 'bank_photo' | 'excel_upload'
  matchedRecordId?: string
  status: 'matched' | 'unmatched_flow' | 'unmatched_record'
  createdAt: string
}

export interface AccountingTemplate {
  id: string
  name: string
  icon: string
  type: RecordType
  category: string
  subcategory?: string
  description?: string
}

export interface OcrResult {
  amount?: number
  date?: string
  items?: Array<{ name: string; quantity?: number; price?: number }>
  vendor?: string
  rawText?: string
  confidence: number
}

export interface VoiceParseResult {
  type?: RecordType
  amount?: number
  productName?: string
  quantity?: number
  description?: string
  category?: string
  time?: string
  rawText: string
  confidence: number
}
