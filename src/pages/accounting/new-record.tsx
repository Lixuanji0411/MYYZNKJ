import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Camera, Mic, FileText, ArrowLeft, Loader2, Square,
  ShoppingBag, Package, Home, Zap, Users, Truck, Briefcase, Coffee,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { accountingService } from '@/services/accounting.service'
import { ocrService } from '@/services/ocr.service'
import { voiceService } from '@/services/voice.service'
import { DEFAULT_TEMPLATES } from '@/config/categories'
import { toast } from 'sonner'
import { AudioWaveform } from '@/components/shared/audio-waveform'

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingBag, Package, Home, Zap, Users, Truck, Briefcase, Coffee,
}

export default function NewRecordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') || 'template'
  const [activeMode, setActiveMode] = useState(initialMode)

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrRawText, setOcrRawText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000)
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRecording])

  async function handlePhotoUpload(file: File) {
    setOcrLoading(true)
    setOcrRawText('')
    try {
      toast.info('正在识别图片...')
      const result = await ocrService.recognizeInvoice(file)
      if (result.amount) setAmount(String(result.amount))
      if (result.date) setDate(result.date)
      if (result.items?.[0]?.name) setDescription(result.items[0].name)
      if (result.rawText) setOcrRawText(result.rawText)
      if (result.vendor) setDescription(prev => prev ? `${prev} - ${result.vendor}` : result.vendor || '')
      // 尝试自动分类
      const desc = result.items?.[0]?.name || result.vendor || ''
      if (desc) {
        const classified = accountingService.autoClassify(desc)
        if (classified && classified.confidence > 0.5) {
          setCategory(classified.category)
          setType(classified.type)
        }
      }
      toast.success(`识别完成 (置信度 ${Math.round(result.confidence * 100)}%)`)
    } catch (err) {
      toast.error(`识别失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setOcrLoading(false)
    }
  }

  async function handleVoiceToggle() {
    if (isRecording) {
      setIsRecording(false)
      setVoiceLoading(true)
      try {
        const audioBlob = await voiceService.stopRecording()
        toast.info('正在识别语音...')
        const text = await voiceService.transcribe(audioBlob)
        setVoiceText(text)
        toast.info('正在智能解析内容...')
        const parsed = await voiceService.parseVoiceText(text)
        if (parsed.amount) setAmount(String(parsed.amount))
        if (parsed.type) setType(parsed.type)
        if (parsed.description) setDescription(parsed.description)
        if (parsed.time) setTime(parsed.time)
        if (parsed.category) {
          setCategory(parsed.category)
        } else if (parsed.productName) {
          const classified = accountingService.autoClassify(parsed.productName)
          if (classified && classified.confidence > 0.5) setCategory(classified.category)
        }
        toast.success(`智能解析完成：${parsed.type === 'income' ? '收入' : '支出'} ¥${parsed.amount || 0}`)
      } catch (err) {
        toast.error(`语音识别失败: ${err instanceof Error ? err.message : '未知错误'}`)
      } finally {
        setVoiceLoading(false)
      }
    } else {
      try {
        await voiceService.startRecording()
        setIsRecording(true)
        setVoiceText('')
        toast.info('正在录音，请说话...')
      } catch (err) {
        toast.error(`${err instanceof Error ? err.message : '录音启动失败'}`)
      }
    }
  }

  async function handleSubmit() {
    if (!amount || !description || !category) {
      toast.error('请填写完整信息')
      return
    }

    setIsSubmitting(true)
    try {
      const sourceMap: Record<string, string> = { template: 'template', photo: 'photo', voice: 'voice' }
      await accountingService.create({
        type,
        amount: parseFloat(amount),
        description,
        category,
        date,
        time,
        source: (sourceMap[activeMode] || 'manual') as 'manual' | 'photo' | 'voice' | 'template',
        isReconciled: false,
      })

      // 用户修正分类时，自动优化映射库（提升未来自动分类准确率）
      const autoClassified = accountingService.autoClassify(description)
      if (description && (!autoClassified || autoClassified.category !== category)) {
        await accountingService.updateCategoryMapping(description, category, type)
      }

      toast.success('记录已保存')
      navigate('/accounting')
    } catch {
      toast.error('保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleTemplateClick(template: { name: string; category: string; type: 'income' | 'expense' }) {
    setDescription(template.name)
    setCategory(template.category)
    setType(template.type)
  }

  const autoResult = description ? accountingService.autoClassify(description) : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-xl font-bold text-rich">新建记录</h1>
          <p className="text-sm text-muted-foreground">选择录入方式</p>
        </div>
      </div>

      <Tabs defaultValue={initialMode} onValueChange={setActiveMode}>
        <TabsList className="w-full">
          <TabsTrigger value="template" className="flex-1">
            <FileText className="mr-1.5 h-3.5 w-3.5" /> 模板录入
          </TabsTrigger>
          <TabsTrigger value="photo" className="flex-1">
            <Camera className="mr-1.5 h-3.5 w-3.5" /> 拍照记账
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex-1">
            <Mic className="mr-1.5 h-3.5 w-3.5" /> 语音录入
          </TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-4 mt-4">
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm"><span className="section-label">快捷模板</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_TEMPLATES.map((t) => (
                  <Button
                    key={t.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateClick(t)}
                    className="text-xs"
                  >
                    {(() => { const Icon = ICON_MAP[t.icon]; return Icon ? <Icon className="mr-1 h-3 w-3" /> : null })()} {t.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select value={type} onValueChange={(v: 'income' | 'expense') => setType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">收入</SelectItem>
                      <SelectItem value="expense">支出</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>金额</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>描述</Label>
                <Input
                  placeholder="例：购买办公用品"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    const result = accountingService.autoClassify(e.target.value)
                    if (result && result.confidence > 0.7) {
                      setCategory(result.category)
                      setType(result.type)
                    }
                  }}
                />
                {autoResult && autoResult.confidence > 0.5 && (
                  <p className="text-xs text-muted-foreground">
                    智能分类：{autoResult.category}（置信度 {Math.round(autoResult.confidence * 100)}%）
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>分类</Label>
                <Input
                  placeholder="分类"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>日期</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>时间</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存记录'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photo" className="mt-4 space-y-4">
          <Card className="card-premium">
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <div className="icon-vessel h-16 w-16 rounded-xl bg-primary/10">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">拍照记账</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  上传发票或单据照片，自动识别金额和商品
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handlePhotoUpload(file)
                  e.target.value = ''
                }}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={ocrLoading}>
                  {ocrLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                  {ocrLoading ? '识别中...' : '拍照/选图'}
                </Button>
              </div>
              {ocrRawText && (
                <div className="w-full rounded-lg bg-muted/50 p-3 inner-glow">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">OCR 识别原文：</p>
                  <p className="whitespace-pre-wrap text-xs">{ocrRawText}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {(amount || description) && (
            <Card className="card-premium">
              <CardContent className="space-y-4 pt-6">
                <p className="text-sm font-medium text-primary">识别结果已填入下方，请确认后保存：</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>类型</Label>
                    <Select value={type} onValueChange={(v: 'income' | 'expense') => setType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">收入</SelectItem>
                        <SelectItem value="expense">支出</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>金额</Label>
                    <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>描述</Label>
                  <Input placeholder="商品/服务描述" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>分类</Label>
                  <Input placeholder="分类" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>日期</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>时间</Label>
                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? '保存中...' : '确认保存'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="voice" className="mt-4 space-y-4">
          <Card className="card-premium">
            <CardContent className="flex flex-col items-center gap-5 p-6">
              {/* 录音按钮 + 状态指示 */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleVoiceToggle}
                  disabled={voiceLoading}
                  className={`relative flex h-20 w-20 items-center justify-center rounded-2xl transition-all ${
                    voiceLoading
                      ? 'bg-muted cursor-wait'
                      : isRecording
                        ? 'bg-destructive/15 shadow-lg shadow-destructive/20'
                        : 'bg-chart-2/10 hover:bg-chart-2/15 cursor-pointer'
                  }`}
                >
                  {isRecording && (
                    <span className="absolute inset-0 rounded-2xl border-2 border-destructive/30 animate-pulse" />
                  )}
                  {voiceLoading ? (
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                  ) : isRecording ? (
                    <Square className="h-7 w-7 text-destructive" />
                  ) : (
                    <Mic className="h-8 w-8 text-chart-2" />
                  )}
                </button>
                <div className="text-center">
                  {voiceLoading ? (
                    <p className="text-sm font-medium text-muted-foreground">正在识别语音...</p>
                  ) : isRecording ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-destructive">正在录音</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
                      </p>
                      <p className="text-xs text-muted-foreground">点击上方按钮停止</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium">语音记账</p>
                      <p className="text-sm text-muted-foreground">
                        点击上方按钮开始录音
                      </p>
                      <p className="text-xs text-muted-foreground">
                        例如「卖3件T恤收1500元」
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 声波可视化 */}
              <div className="w-full flex justify-center">
                <AudioWaveform isActive={isRecording} barCount={40} className="h-12" />
              </div>

              {/* 识别结果展示 */}
              {voiceText && (
                <div className="w-full space-y-2">
                  <div className="rounded-lg border border-income/20 bg-income/5 p-3">
                    <p className="mb-1 text-xs font-medium text-income flex items-center gap-1">
                      <Mic className="h-3 w-3" /> 识别成功
                    </p>
                    <p className="text-sm font-medium">「{voiceText}」</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {voiceText && (amount || description) && (
            <Card className="card-premium">
              <CardContent className="space-y-4 pt-6">
                <p className="text-sm font-medium text-primary">语音解析结果已填入，请确认后保存：</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>类型</Label>
                    <Select value={type} onValueChange={(v: 'income' | 'expense') => setType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">收入</SelectItem>
                        <SelectItem value="expense">支出</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>金额</Label>
                    <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>描述</Label>
                  <Input placeholder="描述" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>分类</Label>
                  <Input placeholder="分类" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>日期</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>时间</Label>
                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? '保存中...' : '确认保存'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
