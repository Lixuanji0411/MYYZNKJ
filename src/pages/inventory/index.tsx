import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { productService } from '@/services/inventory.service'
import { formatCurrency } from '@/lib/format'
import { DataTablePagination, paginateData, type PaginationState } from '@/components/shared/data-table-pagination'
import type { Product, StockAlert } from '@/types/inventory'

export default function InventoryPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [stockTab, setStockTab] = useState('all')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  useEffect(() => {
    async function load() {
      const [prods, alts] = await Promise.all([
        productService.getActiveProducts(),
        productService.getStockAlerts(),
      ])
      setProducts(prods)
      setAlerts(alts)
    }
    load()
  }, [])

  const alertIds = useMemo(() => new Set(alerts.map((a) => a.productId)), [alerts])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesTab = stockTab === 'all' ||
        (stockTab === 'low' && alertIds.has(p.id)) ||
        (stockTab === 'normal' && !alertIds.has(p.id))
      return matchesSearch && matchesTab
    })
  }, [products, searchQuery, stockTab, alertIds])

  const paginatedProducts = paginateData(filtered, pagination)

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [searchQuery, stockTab])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="font-display text-2xl font-bold text-rich">库存管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            商品管理 · 进销存联动 · 库存预警
          </p>
        </div>
        <div className="action-bar">
          <Link to="/inventory/stock-in">
            <Button variant="ghost" size="sm">
              <ArrowDownToLine className="mr-1 h-4 w-4" /> 入库
            </Button>
          </Link>
          <Link to="/inventory/stock-out">
            <Button size="sm" className="rounded-lg">
              <ArrowUpFromLine className="mr-1 h-4 w-4" /> 出库/销售
            </Button>
          </Link>
        </div>
      </div>

      {alerts.length > 0 && (
        <Card className="border-warning/30 bg-warning/5 inner-glow">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-sm text-foreground">
              有 <strong>{alerts.length}</strong> 个商品库存不足，请及时补货
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(12 45% 42%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5">
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">商品总数</p>
            <p className="stat-emboss mt-1 text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(36 72% 52%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5">
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">库存总值</p>
            <p className="stat-emboss mt-1 text-2xl font-bold text-primary">
              {formatCurrency(products.reduce((s, p) => s + p.currentStock * p.costPrice, 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(36 72% 52%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5">
            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">预警商品</p>
            <p className="stat-emboss mt-1 text-2xl font-bold text-warning">{alerts.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-premium">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base"><span className="section-label">商品列表</span></CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索商品名称/分类..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-52 pl-8 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={stockTab} onValueChange={setStockTab}>
            <TabsList>
              <TabsTrigger value="all">全部 ({products.length})</TabsTrigger>
              <TabsTrigger value="low">库存不足 ({alerts.length})</TabsTrigger>
              <TabsTrigger value="normal">正常 ({products.length - alerts.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {paginatedProducts.length > 0 ? (
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/40">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground/80">商品名称</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground/80 w-20">分类</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground/80 w-20">库存</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground/80 w-24">售价</th>
                      <th className="hidden sm:table-cell px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground/80 w-24">成本价</th>
                      <th className="hidden sm:table-cell px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground/80 w-28">库存价值</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground/80 w-16">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product, idx) => {
                      const isLow = alertIds.has(product.id)
                      return (
                        <tr
                          key={product.id}
                          className={`border-b border-border/20 transition-colors hover:bg-muted/20 cursor-pointer ${idx === paginatedProducts.length - 1 ? 'border-b-0' : ''}`}
                          onClick={() => navigate(`/inventory/${product.id}`)}
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
                                <Package className="h-4 w-4 text-primary" />
                              </div>
                              <span className="text-[13px] font-semibold text-foreground">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs text-muted-foreground">{product.category || '未分类'}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`font-mono text-sm font-semibold ${isLow ? 'text-warning' : 'text-foreground'}`}>
                              {product.currentStock}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-0.5">{product.unit}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="font-mono text-sm text-income">¥{formatCurrency(product.unitPrice)}</span>
                          </td>
                          <td className="hidden sm:table-cell px-3 py-2.5 text-right">
                            <span className="font-mono text-sm text-muted-foreground">¥{formatCurrency(product.costPrice)}</span>
                          </td>
                          <td className="hidden sm:table-cell px-3 py-2.5 text-right">
                            <span className="font-mono text-sm font-medium text-foreground">¥{formatCurrency(product.currentStock * product.costPrice)}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${isLow ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                              {isLow ? '不足' : '正常'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                {searchQuery ? '未找到匹配的商品' : '暂无商品，录入带商品信息的记账记录后自动创建'}
              </div>
            )}

            {filtered.length > 0 && (
              <DataTablePagination
                totalItems={filtered.length}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
