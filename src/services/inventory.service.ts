import type { Product, StockMovement, StockAlert } from '@/types/inventory'
import { LocalStorageService } from './base.service'

class ProductService extends LocalStorageService<Product> {
  constructor() {
    super('products')
  }

  async getActiveProducts(): Promise<Product[]> {
    const all = await this.getAll()
    return all.filter((p) => p.isActive)
  }

  async getStockAlerts(): Promise<StockAlert[]> {
    const products = await this.getActiveProducts()
    return products
      .filter((p) => p.currentStock <= p.minStockAlert)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        currentStock: p.currentStock,
        minStockAlert: p.minStockAlert,
        deficit: p.minStockAlert - p.currentStock,
      }))
      .sort((a, b) => b.deficit - a.deficit)
  }

  async adjustStock(productId: string, quantityChange: number): Promise<Product> {
    const product = await this.getById(productId)
    if (!product) throw new Error('商品不存在')

    const newStock = product.currentStock + quantityChange
    if (newStock < 0) throw new Error('库存不足')

    return this.update(productId, { currentStock: newStock })
  }

  async searchProducts(query: string): Promise<Product[]> {
    const all = await this.getActiveProducts()
    const q = query.toLowerCase()
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q))
    )
  }
}

class StockMovementService extends LocalStorageService<StockMovement> {
  constructor() {
    super('stock_movements')
  }

  async getByProduct(productId: string): Promise<StockMovement[]> {
    const all = await this.getAll()
    return all
      .filter((m) => m.productId === productId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async getByDateRange(startDate: string, endDate: string): Promise<StockMovement[]> {
    const all = await this.getAll()
    return all.filter((m) => {
      const date = m.createdAt.split('T')[0]
      return date >= startDate && date <= endDate
    })
  }
}

export const productService = new ProductService()
export const stockMovementService = new StockMovementService()
