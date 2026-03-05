import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Camera,
  Mic,
  FileText,
  TrendingUp,
  Receipt,
  Package,
  Calculator,
  BarChart3,
  Lightbulb,
  Copy,
  Check,
  Bot,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChatStore } from '@/stores/chat.store'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

const QUICK_PROMPTS = [
  { icon: Receipt, label: '今日收支汇总', prompt: '帮我汇总一下今天的收入和支出情况', color: 'text-chart-1' },
  { icon: TrendingUp, label: '本月利润分析', prompt: '分析一下本月的利润情况，跟上月相比有什么变化？', color: 'text-chart-2' },
  { icon: Package, label: '库存预警查询', prompt: '哪些商品库存不足需要补货？', color: 'text-chart-3' },
  { icon: Calculator, label: '税务申报提醒', prompt: '最近有什么税务申报需要处理？截止日期是什么时候？', color: 'text-chart-4' },
  { icon: BarChart3, label: '销售排行榜', prompt: '帮我看看哪些商品卖得最好，哪些最差？', color: 'text-chart-5' },
  { icon: Lightbulb, label: '经营建议', prompt: '根据我的经营数据，给我一些优化建议', color: 'text-accent' },
]

const SCENARIO_CARDS = [
  {
    title: '拍照记账',
    icon: Camera,
    desc: '拍摄发票或收据，AI自动识别金额、日期、商品信息并录入',
    gradient: 'from-chart-1/10 to-chart-1/5',
  },
  {
    title: '语音记账',
    icon: Mic,
    desc: '说一句话就能记账，例如"今天卖了3件T恤收入1500元"',
    gradient: 'from-chart-2/10 to-chart-2/5',
  },
  {
    title: '智能分析',
    icon: BarChart3,
    desc: '用自然语言查询任何财务数据，AI为您解读经营状况',
    gradient: 'from-chart-3/10 to-chart-3/5',
  },
  {
    title: '税务问答',
    icon: Calculator,
    desc: '不懂报税？AI帮您解答税务政策、申报流程等问题',
    gradient: 'from-chart-4/10 to-chart-4/5',
  },
]

export default function AiChatPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const getCurrentSession = useChatStore((s) => s.getCurrentSession)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const createSession = useChatStore((s) => s.createSession)
  const isTyping = useChatStore((s) => s.isTyping)
  const currentSession = getCurrentSession()

  const [input, setInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!currentSession) {
      createSession()
    }
  }, [currentSession, createSession])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.messages?.length])

  async function handleSend() {
    const text = input.trim()
    if (!text) return
    setInput('')
    await sendMessage(text)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleQuickPrompt(prompt: string) {
    setInput('')
    sendMessage(prompt)
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const messages = currentSession?.messages || []
  const hasMessages = messages.length > 0

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {!hasMessages ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl space-y-8"
          >
            {/* 欢迎区域 */}
            <div className="text-center">
              <div className="mx-auto mb-4 icon-vessel h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-sm gold-frame">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-bold text-rich">
                你好，{user?.name || '用户'}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                我是你的 AI 财务助手，可以帮你记账、查账、分析经营数据
              </p>
            </div>

            {/* 场景卡片 */}
            <div className="grid gap-3 sm:grid-cols-2">
              {SCENARIO_CARDS.map((card) => (
                <Card key={card.title} className={`card-premium bg-gradient-to-br ${card.gradient} cursor-pointer`}>
                  <CardContent className="p-4">
                    <p className="flex items-center gap-1.5 text-base font-semibold"><card.icon className="h-4 w-4 text-primary/70" /> {card.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 快捷提问 */}
            <div>
              <p className="mb-3 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground"><span className="section-label"><Lightbulb className="h-3.5 w-3.5" /> 试试这些常用问题</span></p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((item) => (
                  <Button
                    key={item.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt(item.prompt)}
                    className="gap-1.5 rounded-lg border-border/60 bg-card/80 text-xs hover:bg-primary/5 hover:border-primary/30"
                  >
                    <item.icon className={cn('h-3.5 w-3.5', item.color)} />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-6">
          <div className="mx-auto max-w-3xl space-y-6 py-6">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="mt-1 h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={cn(
                    'group relative max-w-[85%] rounded-xl px-4 py-3',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-card border border-border/60 rounded-bl-md shadow-sm inner-glow'
                  )}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>
                    <div className={cn(
                      'mt-1.5 flex items-center gap-2 text-[11px]',
                      msg.role === 'user' ? 'text-primary-foreground/60 justify-end' : 'text-muted-foreground'
                    )}>
                      <span>{new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
                        >
                          {copiedId === msg.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <Avatar className="mt-1 h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <Avatar className="mt-1 h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5 rounded-xl rounded-bl-md border border-border/60 bg-card px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-sm bg-primary/50"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-xs text-muted-foreground">思考中...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      {/* 输入区域 */}
      <div className="border-t bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto max-w-3xl">
          {hasMessages && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.slice(0, 4).map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleQuickPrompt(item.prompt)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-card/80 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground hover:border-primary/30"
                >
                  <item.icon className={cn('h-3 w-3', item.color)} />
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative flex items-end gap-2 rounded-xl border border-border/60 bg-card p-2 shadow-sm focus-within:border-primary/40 focus-within:shadow-md focus-within:shadow-primary/5 transition-all inner-glow">
            <div className="flex gap-1 pb-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="拍照记账" onClick={() => navigate('/accounting/new?mode=photo')}>
                <Camera className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="语音输入" onClick={() => navigate('/accounting/new?mode=voice')}>
                <Mic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="模板记账" onClick={() => navigate('/accounting/new?mode=template')}>
                <FileText className="h-4 w-4" />
              </Button>
            </div>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="问我任何关于记账、税务、库存的问题..."
              className="min-h-[40px] max-h-[120px] flex-1 resize-none border-0 bg-transparent p-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />

            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="mb-1 h-9 w-9 shrink-0 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            AI 助手基于您的记账数据提供分析建议，仅供参考，重要决策请咨询专业人士
          </p>
        </div>
      </div>
    </div>
  )
}
