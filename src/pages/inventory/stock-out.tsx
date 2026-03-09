import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { productService, stockMovementService } from '@/services/inventory.service'
import { accountingService } from '@/services/accounting.service'
import { toast } from 'sonner'
import type { Product } from '@/types/inventory'

export default function StockOutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get('productId')

  const [products, setProducts] = useState<Product[]>([])
  const [selectedId, setSelectedId] = useState(preselectedId || '')
  const [quantity, setQuantity] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // 新商品相关状态
  const [isAddNewProduct, setIsAddNewProduct] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductUnit, setNewProductUnit] = useState('个')
  const [newProductCategory, setNewProductCategory] = useState('')
  const [newProductMinStock, setNewProductMinStock] = useState('10')

  useEffect(() => {
    productService.getActiveProducts().then(setProducts)
  }, [])

  useEffect(() => {
    if (selectedId && !isAddNewProduct) {
      const p = products.find((p) => p.id === selectedId)
      if (p && !salePrice) setSalePrice(String(p.unitPrice))
    }
  }, [selectedId, products, isAddNewProduct])

  const selectedProduct = products.find((p) => p.id === selectedId)

  async function handleSubmit() {
    if (!quantity || !salePrice) {
      toast.error('请填写数量和售价')
      return
    }
    const qty = parseInt(quantity)
    const price = parseFloat(salePrice)
    if (qty <= 0 || price <= 0) {
      toast.error('数量和售价必须大于0')
      return
    }
    
    setSubmitting(true)
    try {
      let productId: string
      let productName: string
      let productUnit: string

      if (isAddNewProduct) {
        // 创建新商品
        if (!newProductName) {
          toast.error('请输入商品名称')
          setSubmitting(false)
          return
        }
        
        const newProduct = await productService.create({
          name: newProductName,
          unit: newProductUnit,
          category: newProductCategory || '其他',
          costPrice: price * 0.7, // 假设成本价为售价的70%
          unitPrice: price,
          currentStock: 0, // 新商品初始库存为0
          minStockAlert: parseInt(newProductMinStock) || 10,
          isActive: true
        })
        
        productId = newProduct.id
        productName = newProduct.name
        productUnit = newProduct.unit
        
        // 提示用户库存为0
        toast.warning(`新商品 ${productName} 已创建，但初始库存为0，请先入库后再销售`)
        navigate('/inventory/stock-in?productId=' + productId)
        return
      } else {
        // 使用现有商品
        if (!selectedId) {
          toast.error('请选择商品')
          setSubmitting(false)
          return
        }
        
        if (selectedProduct && qty > selectedProduct.currentStock) {
          toast.error(`库存不足，当前仅剩 ${selectedProduct.currentStock}${selectedProduct.unit}`)
          setSubmitting(false)
          return
        }
        
        const product = selectedProduct!
        productId = product.id
        productName = product.name
        productUnit = product.unit
        
        // 调整库存
        await productService.adjustStock(productId, -qty)
      }

      const totalAmount = qty * price

      // 记录库存变动
      await stockMovementService.create({
        productId: productId,
        productName: productName,
        type: 'out',
        quantity: qty,
        unitPrice: price,
        totalAmount,
        relatedRecordId: '',
        note: note || '销售出库',
      })

      // 生成销售记录
      await accountingService.create({
        type: 'income',
        amount: totalAmount,
        category: '销售收入',
        description: `卖${qty}${productUnit}${productName}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        isReconciled: false,
        source: 'inventory',
        tags: ['销售', '出库'],
        linkedInventoryId: productId,
        linkedProductName: productName,
        quantity: qty,
        unitPrice: price,
      })

      toast.success(`${productName} 出库 ${qty}${productUnit}，已同步生成销售收入记录`)
      navigate('/inventory')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-xl font-bold text-rich">出库 / 销售</h1>
          <p className="text-sm text-muted-foreground">选择商品及数量，自动减库存并生成销售记录</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <ShoppingCart className="h-4 w-4 text-primary" /> 出库信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">选择商品</Label>
            <select
              value={isAddNewProduct ? 'new' : selectedId}
              onChange={(e) => {
                if (e.target.value === 'new') {
                  setIsAddNewProduct(true)
                  setSelectedId('')
                } else {
                  setIsAddNewProduct(false)
                  setSelectedId(e.target.value)
                }
              }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">请选择商品</option>
              <option value="new">+ 添加新商品</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (库存:{p.currentStock}{p.unit})</option>
              ))}
            </select>
          </div>

          {/* 新商品信息 */}
          {isAddNewProduct && (
            <div className="space-y-3 p-3 border border-dashed border-primary/30 rounded-lg">
              <div className="space-y-1.5">
                <Label className="text-xs">商品名称</Label>
                <Input
                  placeholder="输入商品名称"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">单位</Label>
                  <Input
                    placeholder="如：个、件、kg等"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">分类</Label>
                  <Input
                    placeholder="如：食品、办公用品等"
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">库存预警阈值</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="当库存低于此值时预警"
                  value={newProductMinStock}
                  onChange={(e) => setNewProductMinStock(e.target.value)}
                />
              </div>
            </div>
          )}

          {selectedProduct && !isAddNewProduct && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              当前库存: <strong>{selectedProduct.currentStock}{selectedProduct.unit}</strong> · 
              建议售价: <strong>¥{selectedProduct.unitPrice}</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">销售数量</Label>
              <Input
                type="number"
                min="1"
                max={selectedProduct?.currentStock}
                placeholder="数量"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">销售单价 (¥)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="售价"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </div>
          </div>

          {quantity && salePrice && (
            <div className="rounded-lg bg-income/5 p-3 text-sm">
              <span className="text-muted-foreground">销售金额：</span>
              <span className="font-semibold text-income amount-display">
                ¥{(parseInt(quantity || '0') * parseFloat(salePrice || '0')).toFixed(2)}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">备注 (可选)</Label>
            <Input placeholder="如：客户名、订单号等" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
            {submitting ? '提交中...' : '确认出库'}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            出库后将自动减少库存并同步生成「销售收入」记账记录
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
