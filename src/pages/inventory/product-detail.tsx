import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, ArrowUpRight, ArrowDownRight, Edit2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { productService, stockMovementService } from '@/services/inventory.service'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DataTablePagination, paginateData, type PaginationState } from '@/components/shared/data-table-pagination'
import type { Product, StockMovement } from '@/types/inventory'

export default function ProductDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  useEffect(() => {
    if (!id) return
    productService.getById(id).then(setProduct)
    stockMovementService.getByProduct(id).then(setMovements)
  }, [id])

  if (!product) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">加载中...</p>
      </motion.div>
    )
  }

  const isLow = product.currentStock <= product.minStockAlert
  const totalIn = movements.filter((m) => m.type === 'in').reduce((s, m) => s + m.quantity, 0)
  const totalOut = movements.filter((m) => m.type === 'out').reduce((s, m) => s + m.quantity, 0)
  const stockValue = product.currentStock * product.costPrice

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-rich">{product.name}</h1>
          <p className="text-sm text-muted-foreground">{product.category || '未分类'} · {product.unit}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(`/inventory/stock-in?productId=${id}`)}>
          <Edit2 className="h-3 w-3" /> 入库
        </Button>
      </div>

      {/* 商品信息卡片 */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="border-border/50 card-hover">
          <CardContent className="p-4 text-center">
            <p className="text-[11px] text-muted-foreground">当前库存</p>
            <p className={cn('mt-1 text-2xl font-bold amount-display', isLow ? 'text-warning' : '')}>
              {product.currentStock}
            </p>
            <p className="text-[11px] text-muted-foreground">{product.unit}</p>
            {isLow && <Badge variant="destructive" className="mt-1 text-[10px]">低于警戒线</Badge>}
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover">
          <CardContent className="p-4 text-center">
            <p className="text-[11px] text-muted-foreground">售价</p>
            <p className="mt-1 text-2xl font-bold amount-display text-income">¥{formatCurrency(product.unitPrice)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover">
          <CardContent className="p-4 text-center">
            <p className="text-[11px] text-muted-foreground">成本价</p>
            <p className="mt-1 text-2xl font-bold amount-display">¥{formatCurrency(product.costPrice)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover bg-gradient-to-br from-primary/5 to-accent/3">
          <CardContent className="p-4 text-center">
            <p className="text-[11px] text-muted-foreground">库存价值</p>
            <p className="mt-1 text-2xl font-bold amount-display">¥{formatCurrency(stockValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 进销统计 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-border/50 card-hover">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-income/10">
              <ArrowUpRight className="h-5 w-5 text-income" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">累计入库</p>
              <p className="text-lg font-bold amount-display">{totalIn} {product.unit}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-hover">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-expense/10">
              <ArrowDownRight className="h-5 w-5 text-expense" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">累计出库</p>
              <p className="text-lg font-bold amount-display">{totalOut} {product.unit}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 库存变动记录 */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-primary" /> 库存变动记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length > 0 ? (
            <>
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/30">
                      <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground w-16">类型</th>
                      <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground w-20">数量</th>
                      <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">备注</th>
                      <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground w-24">金额</th>
                      <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground w-24">日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginateData(movements, pagination).map((m, idx, arr) => (
                      <tr key={m.id} className={`border-b border-border/20 transition-colors hover:bg-muted/20 ${idx === arr.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="px-3 py-2.5">
                          <div className={cn('flex h-6 w-6 items-center justify-center rounded-md', m.type === 'in' ? 'bg-income/10' : 'bg-expense/10')}>
                            {m.type === 'in' ? <ArrowUpRight className="h-3 w-3 text-income" /> : <ArrowDownRight className="h-3 w-3 text-expense" />}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={cn('font-mono text-sm font-semibold', m.type === 'in' ? 'text-income' : 'text-expense')}>
                            {m.type === 'in' ? '+' : '-'}{m.quantity}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-0.5">{product.unit}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs text-foreground">{m.note || (m.type === 'in' ? '采购入库' : '销售出库')}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={cn('font-mono text-sm', m.type === 'in' ? 'text-income' : 'text-expense')}>
                            ¥{formatCurrency(m.totalAmount)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-xs text-muted-foreground font-mono">{m.createdAt.split('T')[0]}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DataTablePagination
                totalItems={movements.length}
                pagination={pagination}
                onPaginationChange={setPagination}
                pageSizeOptions={[10, 20, 50]}
              />
            </>
          ) : (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">暂无变动记录</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
