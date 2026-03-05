import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Camera,
  Save,
  User,
  Phone,
  Store,
  MapPin,
  Mail,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar,
  Shield,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth.store'
import { accountingService } from '@/services/accounting.service'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [businessName, setBusinessName] = useState(user?.businessName || '')
  const [businessType, setBusinessType] = useState(user?.businessType || 'individual')
  const [taxRegion, setTaxRegion] = useState(user?.taxRegion || '')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')
  const [isSaving, setIsSaving] = useState(false)

  // 收入统计
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalProfit: 0,
    recordCount: 0,
    thisMonthIncome: 0,
    thisMonthExpense: 0,
    reconciledPct: 0,
  })

  useEffect(() => {
    async function loadStats() {
      const all = await accountingService.getAll()
      const now = new Date()
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      const totalIncome = all.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
      const totalExpense = all.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
      const thisMonth = all.filter((r) => r.date.startsWith(monthStr))
      const thisMonthIncome = thisMonth.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
      const thisMonthExpense = thisMonth.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
      const reconciledCount = all.filter((r) => r.isReconciled).length

      setStats({
        totalIncome,
        totalExpense,
        totalProfit: totalIncome - totalExpense,
        recordCount: all.length,
        thisMonthIncome,
        thisMonthExpense,
        reconciledPct: all.length > 0 ? Math.round((reconciledCount / all.length) * 100) : 0,
      })
    }
    loadStats()
  }, [])

  function compressImage(file: File, maxSize = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()
      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > height) {
            if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize }
          } else {
            if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) { reject(new Error('Canvas not supported')); return }
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = reader.result as string
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('头像文件不能超过 5MB')
      return
    }
    try {
      const compressed = await compressImage(file)
      setAvatarPreview(compressed)
      await updateProfile({ avatar: compressed })
      toast.success('头像已更新')
    } catch {
      toast.error('头像处理失败')
    }
    e.target.value = ''
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('请输入姓名')
      return
    }
    setIsSaving(true)
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        businessName: businessName.trim() || undefined,
        businessType: businessType as 'individual' | 'small_taxpayer',
        taxRegion: taxRegion.trim() || undefined,
        avatar: avatarPreview || undefined,
      })
      toast.success('个人信息已保存')
    } catch {
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const memberDays = user?.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 1

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-3xl space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="page-header flex-1">
          <h1 className="font-display text-xl font-bold text-rich">个人中心</h1>
          <p className="text-sm text-muted-foreground">管理您的账户信息和查看经营概览</p>
        </div>
      </div>

      {/* 头像 + 基本信息卡 */}
      <Card className="card-premium overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/5" />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6 -mt-10">
            {/* 头像 */}
            <div className="relative group">
              <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt={name} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* 用户概要 */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-rich">{user?.name || '用户'}</h2>
              <p className="text-sm text-muted-foreground">
                {user?.businessType === 'individual' ? '个体工商户' : '小规模纳税人'}
                {user?.businessName ? ` · ${user.businessName}` : ''}
              </p>
              <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground sm:justify-start">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> 已使用 {memberDays} 天</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> {stats.recordCount} 笔记账</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 经营数据统计 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(152 55% 40%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">累计收入</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-income" />
            </div>
            <p className="stat-emboss text-lg font-bold text-income">{formatCurrency(stats.totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(0 65% 50%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">累计支出</span>
              <ArrowDownRight className="h-3.5 w-3.5 text-expense" />
            </div>
            <p className="stat-emboss text-lg font-bold text-expense">{formatCurrency(stats.totalExpense)}</p>
          </CardContent>
        </Card>
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(12 45% 42%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">累计利润</span>
              <Wallet className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className={cn('stat-emboss text-lg font-bold', stats.totalProfit >= 0 ? 'text-income' : 'text-expense')}>
              {stats.totalProfit >= 0 ? '+' : ''}{formatCurrency(stats.totalProfit)}
            </p>
          </CardContent>
        </Card>
        <Card className="card-premium card-metric" style={{ '--metric-color': 'hsl(195 55% 46%)' } as React.CSSProperties}>
          <CardContent className="p-4 pl-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">对账率</span>
              <TrendingUp className="h-3.5 w-3.5 text-chart-3" />
            </div>
            <p className="stat-emboss text-lg font-bold">{stats.reconciledPct}%</p>
            <Progress value={stats.reconciledPct} className="mt-1.5 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* 本月概览 */}
      <Card className="card-premium">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm"><span className="section-label">本月经营概览</span></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">本月收入</p>
              <p className="text-lg font-bold text-income stat-emboss">{formatCurrency(stats.thisMonthIncome)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">本月支出</p>
              <p className="text-lg font-bold text-expense stat-emboss">{formatCurrency(stats.thisMonthExpense)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">本月利润</p>
              <p className={cn('text-lg font-bold stat-emboss', stats.thisMonthIncome - stats.thisMonthExpense >= 0 ? 'text-income' : 'text-expense')}>
                {stats.thisMonthIncome - stats.thisMonthExpense >= 0 ? '+' : ''}
                {formatCurrency(stats.thisMonthIncome - stats.thisMonthExpense)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 个人信息编辑 */}
      <Card className="card-premium">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm"><span className="section-label">个人信息</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs"><User className="h-3 w-3" /> 姓名</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入姓名" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs"><Phone className="h-3 w-3" /> 手机号</Label>
              <Input value={user?.phone || ''} disabled className="bg-muted/50" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs"><Mail className="h-3 w-3" /> 邮箱</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="选填" type="email" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs"><Store className="h-3 w-3" /> 店铺名称</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="请输入店铺名称" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">纳税人类型</Label>
              <Select value={businessType} onValueChange={(v) => setBusinessType(v as 'individual' | 'small_taxpayer')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">个体工商户</SelectItem>
                  <SelectItem value="small_taxpayer">小规模纳税人</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs"><MapPin className="h-3 w-3" /> 所在地区</Label>
              <Input value={taxRegion} onChange={(e) => setTaxRegion(e.target.value)} placeholder="如：广东省深圳市" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {isSaving ? '保存中...' : '保存修改'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
