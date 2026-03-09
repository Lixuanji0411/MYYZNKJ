import { getItem, setItem, removeItem } from '@/services/storage'
import type { AccountingRecord } from '@/types/accounting'
import type { Product, StockMovement } from '@/types/inventory'

function randomId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function dateStr(daysBack: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysBack)
  return d.toISOString().split('T')[0]
}

const SAMPLE_RECORDS: Omit<AccountingRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { type: 'income', amount: 3200, description: '卖5件印花T恤', category: '销售收入', date: dateStr(0), time: dateStr(0), source: 'manual', isReconciled: true },
  { type: 'income', amount: 1800, description: '卖2条牛仔裤', category: '销售收入', date: dateStr(0), time: dateStr(0), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 280, description: '快递费', category: '物流费用', date: dateStr(0), time: dateStr(0), source: 'manual', isReconciled: false },
  { type: 'income', amount: 4500, description: '团购订单收款', category: '销售收入', date: dateStr(1), time: dateStr(1), source: 'voice', isReconciled: true },
  { type: 'expense', amount: 1200, description: '进货-运动鞋20双', category: '采购成本', date: dateStr(1), time: dateStr(1), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 350, description: '外卖团建午餐', category: '业务招待费', date: dateStr(1), time: dateStr(1), source: 'photo', isReconciled: false },
  { type: 'income', amount: 2600, description: '线上店铺订单', category: '销售收入', date: dateStr(2), time: dateStr(2), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 5000, description: '本月店铺房租', category: '租赁费用', date: dateStr(2), time: dateStr(2), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 420, description: '水电费', category: '水电费', date: dateStr(2), time: dateStr(2), source: 'photo', isReconciled: true },
  { type: 'income', amount: 1500, description: '修衣服务费', category: '服务收入', date: dateStr(3), time: dateStr(3), source: 'manual', isReconciled: false },
  { type: 'expense', amount: 800, description: '打印宣传单页', category: '广告宣传费', date: dateStr(3), time: dateStr(3), source: 'manual', isReconciled: true },
  { type: 'income', amount: 6800, description: '批发出货-T恤100件', category: '销售收入', date: dateStr(4), time: dateStr(4), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 3800, description: '进货-T恤100件', category: '采购成本', date: dateStr(4), time: dateStr(4), source: 'manual', isReconciled: true },
  { type: 'income', amount: 950, description: '退货差价补偿', category: '其他收入', date: dateStr(5), time: dateStr(5), source: 'manual', isReconciled: false },
  { type: 'expense', amount: 150, description: '办公用品(笔/本)', category: '办公费', date: dateStr(5), time: dateStr(5), source: 'manual', isReconciled: true },
  { type: 'income', amount: 2200, description: '卖3件外套', category: '销售收入', date: dateStr(6), time: dateStr(6), source: 'voice', isReconciled: true },
  { type: 'expense', amount: 680, description: '员工加班餐费', category: '员工福利费', date: dateStr(6), time: dateStr(6), source: 'photo', isReconciled: true },
  { type: 'income', amount: 3900, description: '会员储值充值', category: '销售收入', date: dateStr(7), time: dateStr(7), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 2500, description: '进货-外套30件', category: '采购成本', date: dateStr(7), time: dateStr(7), source: 'manual', isReconciled: true },
  { type: 'income', amount: 1100, description: '清仓折扣品', category: '销售收入', date: dateStr(8), time: dateStr(8), source: 'manual', isReconciled: true },
  { type: 'income', amount: 5200, description: '大客户定制订单', category: '销售收入', date: dateStr(10), time: dateStr(10), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 980, description: '税控盘维护费', category: '其他支出', date: dateStr(12), time: dateStr(12), source: 'manual', isReconciled: true },
  { type: 'income', amount: 7500, description: '月初批发出货', category: '销售收入', date: dateStr(15), time: dateStr(15), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 4200, description: '大批进货-混合', category: '采购成本', date: dateStr(15), time: dateStr(15), source: 'manual', isReconciled: true },
  { type: 'income', amount: 3100, description: '散客零售', category: '销售收入', date: dateStr(18), time: dateStr(18), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 600, description: '店铺清洁费', category: '其他支出', date: dateStr(20), time: dateStr(20), source: 'manual', isReconciled: true },
  { type: 'income', amount: 4400, description: '线上直播带货', category: '销售收入', date: dateStr(22), time: dateStr(22), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 1500, description: '直播设备采购', category: '固定资产', date: dateStr(22), time: dateStr(22), source: 'manual', isReconciled: true },
  { type: 'income', amount: 2800, description: '节日促销收入', category: '销售收入', date: dateStr(25), time: dateStr(25), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 5000, description: '上月房租', category: '租赁费用', date: dateStr(32), time: dateStr(32), source: 'manual', isReconciled: true },
  { type: 'income', amount: 8200, description: '上月总销售', category: '销售收入', date: dateStr(35), time: dateStr(35), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 3600, description: '上月进货总额', category: '采购成本', date: dateStr(38), time: dateStr(38), source: 'manual', isReconciled: true },
  { type: 'income', amount: 6100, description: '上上月销售', category: '销售收入', date: dateStr(62), time: dateStr(62), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 2900, description: '上上月进货', category: '采购成本', date: dateStr(65), time: dateStr(65), source: 'manual', isReconciled: true },
  { type: 'expense', amount: 5000, description: '上上月房租', category: '租赁费用', date: dateStr(62), time: dateStr(62), source: 'manual', isReconciled: true },
]

const SAMPLE_PRODUCTS: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '印花T恤', unit: '件', unitPrice: 128, costPrice: 45, currentStock: 38, minStockAlert: 10, isActive: true },
  { name: '牛仔裤(修身款)', unit: '条', unitPrice: 268, costPrice: 95, currentStock: 15, minStockAlert: 5, isActive: true },
  { name: '运动鞋(白色)', unit: '双', unitPrice: 359, costPrice: 160, currentStock: 22, minStockAlert: 8, isActive: true },
  { name: '秋季外套', unit: '件', unitPrice: 399, costPrice: 150, currentStock: 4, minStockAlert: 5, isActive: true },
  { name: '帆布包', unit: '个', unitPrice: 89, costPrice: 28, currentStock: 52, minStockAlert: 10, isActive: true },
  { name: '棒球帽', unit: '顶', unitPrice: 59, costPrice: 18, currentStock: 3, minStockAlert: 10, isActive: true },
  { name: '丝巾(真丝)', unit: '条', unitPrice: 199, costPrice: 68, currentStock: 12, minStockAlert: 5, isActive: true },
  { name: '皮带(牛皮)', unit: '条', unitPrice: 159, costPrice: 55, currentStock: 8, minStockAlert: 5, isActive: true },
]

export function seedTestData() {
  const existingRecords = getItem<AccountingRecord[]>('accounting_records')
  if (existingRecords && existingRecords.length > 5) return false

  const now = new Date().toISOString()

  const records: AccountingRecord[] = SAMPLE_RECORDS.map((r) => ({
    ...r,
    id: randomId(),
    createdAt: r.date ? new Date(r.date).toISOString() : now,
    updatedAt: now,
  }))
  setItem('accounting_records', records)

  const products: Product[] = SAMPLE_PRODUCTS.map((p) => ({
    ...p,
    id: randomId(),
    createdAt: daysAgo(30),
    updatedAt: now,
  }))
  setItem('products', products)

  const movements: StockMovement[] = products.flatMap((p) => [
    {
      id: randomId(),
      productId: p.id,
      productName: p.name,
      type: 'in' as const,
      quantity: p.currentStock + 10,
      unitPrice: p.costPrice,
      totalAmount: (p.currentStock + 10) * p.costPrice,
      relatedRecordId: '',
      note: '初始入库',
      createdAt: daysAgo(30),
      updatedAt: now,
    },
    {
      id: randomId(),
      productId: p.id,
      productName: p.name,
      type: 'out' as const,
      quantity: 10,
      unitPrice: p.unitPrice,
      totalAmount: 10 * p.unitPrice,
      relatedRecordId: records[0]?.id || '',
      note: '日常销售',
      createdAt: daysAgo(5),
      updatedAt: now,
    },
  ])
  setItem('stock_movements', movements)

  return true
}

export function clearTestData() {
  removeItem('accounting_records')
  removeItem('products')
  removeItem('stock_movements')
}
