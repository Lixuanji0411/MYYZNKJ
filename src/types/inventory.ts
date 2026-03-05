export interface Product {
  id: string
  name: string
  unit: string
  unitPrice: number
  costPrice: number
  currentStock: number
  minStockAlert: number
  imageUrl?: string
  barcode?: string
  category?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type StockMovementType = 'in' | 'out'

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: StockMovementType
  quantity: number
  unitPrice: number
  totalAmount: number
  relatedRecordId: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface StockAlert {
  productId: string
  productName: string
  currentStock: number
  minStockAlert: number
  deficit: number
}
