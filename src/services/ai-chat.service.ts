import type { ChatMessage } from '@/types/chat'
import { accountingService } from './accounting.service'
import { productService, stockMovementService } from './inventory.service'
import { generateId, getNow, getItem, setItem } from './storage'
import { aiParseAccountingText } from './ai-parse.service'

export interface AiChatServiceInterface {
  sendMessage(content: string, history: ChatMessage[]): Promise<ChatMessage>
  getMemories(): string[]
  addMemory(fact: string): void
  clearMemories(): void
}

function log(...args: unknown[]) { console.log('[AI-Chat]', ...args) }
function logError(...args: unknown[]) { console.error('[AI-Chat][ERROR]', ...args) }
function formatCurrency(v: number): string {
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ==================== 记忆系统 ====================
const MEMORY_KEY = 'ai_chat_memories'
const MAX_MEMORIES = 50

function loadMemories(): string[] { return getItem<string[]>(MEMORY_KEY) || [] }
function saveMemories(memories: string[]) { setItem(MEMORY_KEY, memories.slice(-MAX_MEMORIES)) }

/** 从 AI 回复中自动提取值得记忆的事实 */
function extractMemorableFacts(userMsg: string, _aiReply: string): string[] {
  const facts: string[] = []
  // 记住用户提到的业务偏好、店名、主营商品等
  const bizMatch = userMsg.match(/(?:我的?(?:店|公司|企业)(?:叫|名|是))(.{2,20})/)
  if (bizMatch) facts.push(`用户店铺/企业名称: ${bizMatch[1]}`)
  const mainMatch = userMsg.match(/(?:主要?(?:卖|经营|做))(.{2,20})/)
  if (mainMatch) facts.push(`主营业务: ${mainMatch[1]}`)
  return facts
}

// ==================== 本地数据上下文构建 ====================

async function buildLocalDataContext(userMsg: string): Promise<{ context: string; relatedData?: ChatMessage['relatedData'] }> {
  const lower = userMsg.toLowerCase()
  const parts: string[] = []
  let relatedData: ChatMessage['relatedData'] | undefined

  try {
    // 始终提供今日概览
    const todaySummary = await accountingService.getTodaySummary()
    parts.push(`【今日概览】收入=${formatCurrency(todaySummary.income)}元, 支出=${formatCurrency(todaySummary.expense)}元, 利润=${formatCurrency(todaySummary.profit)}元, 笔数=${todaySummary.count}`)

    // 月度概览
    const now = new Date()
    const monthSummary = await accountingService.getMonthSummary(now.getFullYear(), now.getMonth() + 1)
    parts.push(`【本月概览】收入=${formatCurrency(monthSummary.income)}元, 支出=${formatCurrency(monthSummary.expense)}元, 利润=${formatCurrency(monthSummary.profit)}元`)

    // 按需提供详细数据
    if (/支出|花了|花费|开支|成本/.test(lower)) {
      const records = await accountingService.getAll({ type: 'expense' })
      const recent = records.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10)
      const total = records.reduce((s, r) => s + r.amount, 0)
      parts.push(`【支出详情】共${records.length}笔, 总计${formatCurrency(total)}元`)
      parts.push(`最近支出: ${recent.map(r => `${r.date} ${r.description} ${formatCurrency(r.amount)}元(${r.category})`).join('; ')}`)
      relatedData = { type: 'record', items: recent }
    }

    if (/收入|收了|赚|营业额|销售额/.test(lower)) {
      const records = await accountingService.getAll({ type: 'income' })
      const recent = records.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10)
      const total = records.reduce((s, r) => s + r.amount, 0)
      parts.push(`【收入详情】共${records.length}笔, 总计${formatCurrency(total)}元`)
      parts.push(`最近收入: ${recent.map(r => `${r.date} ${r.description} ${formatCurrency(r.amount)}元(${r.category})`).join('; ')}`)
      relatedData = { type: 'record', items: recent }
    }

    if (/利润|盈亏|赚了多少|净利/.test(lower)) {
      relatedData = { type: 'report', items: [monthSummary] }
    }

    if (/库存|商品|补货|存货|缺货/.test(lower)) {
      const alerts = await productService.getStockAlerts()
      const products = await productService.getActiveProducts()
      parts.push(`【库存概况】活跃商品${products.length}个, 库存预警${alerts.length}个`)
      if (alerts.length > 0) {
        parts.push(`预警商品: ${alerts.map(a => `${a.productName} 剩${a.currentStock}件(阈值${a.minStockAlert})`).join('; ')}`)
      }
      if (products.length > 0) {
        parts.push(`商品列表: ${products.slice(0, 10).map(p => `${p.name} 库存${p.currentStock}件 ¥${p.unitPrice}`).join('; ')}`)
      }
      relatedData = { type: 'product', items: alerts.length > 0 ? alerts : products.slice(0, 5) }
    }

    if (/查找|找|搜索/.test(lower)) {
      const searchTerm = userMsg.replace(/.*(?:查找|找|搜索)\s*/g, '').trim()
      if (searchTerm) {
        const records = await accountingService.searchRecords(searchTerm)
        parts.push(`【搜索"${searchTerm}"】找到${records.length}条: ${records.slice(0, 5).map(r => `${r.date} ${r.description} ${r.type === 'income' ? '+' : '-'}${formatCurrency(r.amount)}元`).join('; ')}`)
        relatedData = { type: 'record', items: records.slice(0, 5) }
      }
    }

    if (/报税|税务|申报|增值税|所得税/.test(lower)) {
      relatedData = { type: 'tax', items: [] }
    }

    // 提供最近记录作为通用上下文
    if (parts.length <= 2) {
      const recent = await accountingService.getRecentRecords(5)
      if (recent.length > 0) {
        parts.push(`【最近记录】${recent.map(r => `${r.date} ${r.type === 'income' ? '收' : '支'} ${r.description} ${formatCurrency(r.amount)}元`).join('; ')}`)
      }
    }
  } catch (err) {
    logError('构建数据上下文失败:', err)
  }

  return { context: parts.join('\n'), relatedData }
}

// ==================== 记账意图检测与自动记账 ====================

/** 检测用户消息是否包含库存操作意图 */
function isInventoryIntent(text: string): boolean {
  // 关键词匹配：用户明确想进行库存操作
  const intentPatterns = [
    /(?:入库|进货|采购|补货)/,
    /(?:出库|销售|卖出|出货)/,
    /(?:库存|商品|货物|物品).*?(?:增加|减少|调整)/,
    /(?:添加|创建|新增).*?(?:商品|产品)/,
    /(?:商品|产品).*?(?:入库|出库)/,
  ]
  if (intentPatterns.some((p) => p.test(text))) return true

  // 复合判断：同时包含库存动作+商品+数量
  const hasAction = /入库|进货|采购|出库|销售|卖出/.test(text)
  const hasProduct = /[\u4e00-\u9fa5a-zA-Z0-9]+(?:商品|产品|货物|物品)/.test(text)
  const hasQuantity = /\d+\s*(?:个|件|kg|公斤|吨|箱|盒|套|台|辆)/.test(text)
  if (hasAction && (hasProduct || hasQuantity)) return true

  return false
}

/** 检测用户消息是否包含记账意图 */
function isAccountingIntent(text: string): boolean {
  // 关键词匹配：用户明确想记一笔账
  const intentPatterns = [
    /帮我记[账一笔]/,
    /记[一这]笔/,
    /记录一下/,
    /记下来/,
    /帮我[存保]/, // 帮我存/帮我保存
    /记个账/,
    /入[一]?笔账/,
    /记到账[里本上]/,
  ]
  if (intentPatterns.some((p) => p.test(text))) return true

  // 复合判断：同时包含交易动作+金额描述
  const hasAction = /卖了?|买了?|花了?|收了?|付了?|支出|收入|采购|进货|交了|缴了/.test(text)
  const hasAmount = /\d+\s*(?:块钱?|元|万|千|百)/.test(text)
  if (hasAction && hasAmount) return true

  return false
}

/** 自动处理库存操作：解析 → 执行 → 生成记录 */
async function handleInventoryOperation(content: string): Promise<ChatMessage> {
  try {
    // 解析用户消息，提取操作类型、商品、数量、单价等信息
    const parsed = await parseInventoryOperation(content)
    log('AI解析库存操作结果:', parsed)

    // 校验必要字段
    if (!parsed.productName) {
      return {
        id: generateId(),
        role: 'assistant',
        content: `我理解你想进行库存操作，但没有识别到具体商品名称。请告诉我商品名称是什么？\n\n例如："苹果入库10个，每个5元"`,
        timestamp: getNow(),
      }
    }

    if (!parsed.quantity || parsed.quantity <= 0) {
      return {
        id: generateId(),
        role: 'assistant',
        content: `我理解你想进行库存操作，但没有识别到具体数量。请告诉我数量是多少？\n\n例如："苹果入库10个，每个5元"`,
        timestamp: getNow(),
      }
    }

    if (!parsed.unitPrice || parsed.unitPrice <= 0) {
      return {
        id: generateId(),
        role: 'assistant',
        content: `我理解你想进行库存操作，但没有识别到具体单价。请告诉我单价是多少？\n\n例如："苹果入库10个，每个5元"`,
        timestamp: getNow(),
      }
    }

    const today = new Date().toISOString().split('T')[0]
    const nowTime = new Date().toTimeString().slice(0, 5)
    const totalAmount = parsed.quantity * parsed.unitPrice

    // 查找或创建商品
    let product = await findOrCreateProduct(parsed.productName, parsed.unit || '个', parsed.unitPrice)

    // 执行库存操作
    if (parsed.type === 'in') {
      // 入库操作
      await productService.adjustStock(product.id, parsed.quantity)
      
      // 记录库存变动
      await stockMovementService.create({
        productId: product.id,
        productName: product.name,
        type: 'in',
        quantity: parsed.quantity,
        unitPrice: parsed.unitPrice,
        totalAmount,
        relatedRecordId: '',
        note: parsed.note || '采购入库',
      })

      // 生成采购记录
      await accountingService.create({
        type: 'expense',
        amount: totalAmount,
        category: '采购成本',
        description: `进货-${product.name}${parsed.quantity}${product.unit}`,
        date: today,
        time: nowTime,
        isReconciled: false,
        tags: ['采购', '入库'],
        source: 'ai-chat',
        linkedInventoryId: product.id,
        linkedProductName: product.name,
      })

      const reply = `✅ **已帮你完成入库操作！**

📦 商品：${product.name}
📥 入库数量：${parsed.quantity}${product.unit}
💰 进货单价：¥${parsed.unitPrice.toFixed(2)}
📊 合计金额：¥${totalAmount.toFixed(2)}
📅 日期：${today}

库存已更新，同时生成了采购成本记录。`

      return {
        id: generateId(),
        role: 'assistant',
        content: reply,
        timestamp: getNow(),
        relatedData: { type: 'product', items: [product] },
      }
    } else {
      // 出库操作
      if (product.currentStock < parsed.quantity) {
        return {
          id: generateId(),
          role: 'assistant',
          content: `库存不足，${product.name} 当前库存仅剩 ${product.currentStock}${product.unit}，无法出库 ${parsed.quantity}${product.unit}。`,
          timestamp: getNow(),
        }
      }

      await productService.adjustStock(product.id, -parsed.quantity)
      
      // 记录库存变动
      await stockMovementService.create({
        productId: product.id,
        productName: product.name,
        type: 'out',
        quantity: parsed.quantity,
        unitPrice: parsed.unitPrice,
        totalAmount,
        relatedRecordId: '',
        note: parsed.note || '销售出库',
      })

      // 生成销售记录
      await accountingService.create({
        type: 'income',
        amount: totalAmount,
        category: '销售收入',
        description: `卖${parsed.quantity}${product.unit}${product.name}`,
        date: today,
        time: nowTime,
        isReconciled: false,
        source: 'ai-chat',
        tags: ['销售', '出库'],
        linkedInventoryId: product.id,
        linkedProductName: product.name,
        quantity: parsed.quantity,
        unitPrice: parsed.unitPrice,
      })

      const reply = `✅ **已帮你完成出库操作！**

📦 商品：${product.name}
📤 出库数量：${parsed.quantity}${product.unit}
💰 销售单价：¥${parsed.unitPrice.toFixed(2)}
📊 销售金额：¥${totalAmount.toFixed(2)}
📅 日期：${today}

库存已更新，同时生成了销售收入记录。`

      return {
        id: generateId(),
        role: 'assistant',
        content: reply,
        timestamp: getNow(),
        relatedData: { type: 'product', items: [product] },
      }
    }
  } catch (err) {
    logError('处理库存操作失败:', err)
    return {
      id: generateId(),
      role: 'assistant',
      content: `处理库存操作时出现了问题：${err instanceof Error ? err.message : '未知错误'}\n\n你可以到「库存管理」页面手动操作。`,
      timestamp: getNow(),
    }
  }
}

/** 解析库存操作消息 */
async function parseInventoryOperation(content: string): Promise<{
  type: 'in' | 'out'
  productName: string
  quantity: number
  unitPrice: number
  unit?: string
  note?: string
}> {
  // 简单的规则解析，实际项目中可以使用更复杂的NLP
  const lower = content.toLowerCase()
  
  // 确定操作类型
  const isIn = /入库|进货|采购|补货/.test(lower)
  const type: 'in' | 'out' = isIn ? 'in' : 'out'
  
  // 提取数量
  const quantityMatch = content.match(/(\d+)\s*(个|件|kg|公斤|吨|箱|盒|套|台|辆)/)
  const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 0
  const unit = quantityMatch ? quantityMatch[2] : '个'
  
  // 提取单价
  const priceMatch = content.match(/(\d+(?:\.\d+)?)\s*(元|块)/)
  const unitPrice = priceMatch ? parseFloat(priceMatch[1]) : 0
  
  // 提取商品名称
  // 简单规则：匹配数量和单价之间的文本
  let productName = '未知商品'
  if (quantityMatch && priceMatch && quantityMatch.index !== undefined && priceMatch.index !== undefined) {
    const start = quantityMatch.index + quantityMatch[0].length
    const end = priceMatch.index
    productName = content.substring(start, end).trim()
    // 移除可能的修饰词
    productName = productName.replace(/(每个|每斤|每kg|单价|价格|进价|售价)/g, '').trim()
  }
  
  return {
    type,
    productName,
    quantity,
    unitPrice,
    unit,
  }
}

/** 查找或创建商品 */
async function findOrCreateProduct(name: string, unit: string, price: number): Promise<any> {
  const products = await productService.getAll()
  const existingProduct = products.find(p => p.name === name && p.isActive)
  
  if (existingProduct) {
    return existingProduct
  }
  
  // 创建新商品
  const newProduct = await productService.create({
    name,
    unit,
    category: '其他',
    costPrice: price,
    unitPrice: price,
    currentStock: 0,
    minStockAlert: 10,
    isActive: true
  })
  
  return newProduct
}

/** 自动记账：AI解析 → 保存到数据库 → 返回确认消息 */
async function handleAutoAccounting(content: string): Promise<ChatMessage> {
  try {
    const parsed = await aiParseAccountingText(content)
    log('AI解析记账结果:', parsed)

    // 校验必要字段
    if (!parsed.amount || parsed.amount <= 0) {
      return {
        id: generateId(),
        role: 'assistant',
        content: `我理解你想记一笔账，但没有识别到具体金额。请告诉我金额是多少？\n\n例如："今天卖了3个苹果，一共60元"`,
        timestamp: getNow(),
      }
    }

    const recordType = parsed.type || 'expense'
    const category = parsed.category || (recordType === 'income' ? '销售收入' : '其他支出')
    const description = parsed.description || content.slice(0, 30)
    const today = new Date().toISOString().split('T')[0]
    const nowTime = parsed.time || new Date().toTimeString().slice(0, 5)

    // 保存到数据库
    const record = await accountingService.create({
      type: recordType,
      amount: parsed.amount,
      category,
      description,
      date: today,
      time: nowTime,
      source: 'ai-chat',
      quantity: parsed.quantity,
      linkedProductName: parsed.productName,
      isReconciled: false,
    })

    log('记账成功:', record.id, recordType, parsed.amount, description)

    const typeLabel = recordType === 'income' ? '📈 收入' : '📉 支出'
    const reply = `✅ **已帮你记录一笔账！**

${typeLabel}：¥${parsed.amount.toFixed(2)}
📝 描述：${description}
📂 分类：${category}
📅 日期：${today}
🕐 时间：${nowTime}
${parsed.productName ? `🏷️ 商品：${parsed.productName}${parsed.quantity ? ` × ${parsed.quantity}` : ''}` : ''}

记录已保存到系统中，你可以在「智能记账」页面查看和编辑。`

    return {
      id: generateId(),
      role: 'assistant',
      content: reply,
      timestamp: getNow(),
      relatedData: { type: 'record', items: [record] },
    }
  } catch (err) {
    logError('自动记账失败:', err)
    return {
      id: generateId(),
      role: 'assistant',
      content: `记账时出现了问题：${err instanceof Error ? err.message : '未知错误'}\n\n你可以到「智能记账 → 新建记录」页面手动录入。`,
      timestamp: getNow(),
    }
  }
}

// ==================== 主服务 ====================

export const aiChatService: AiChatServiceInterface = {
  async sendMessage(content: string, history: ChatMessage[]): Promise<ChatMessage> {
    log('用户消息:', content)
    try {
      // 0. 检测库存操作意图
      if (isInventoryIntent(content)) {
        log('检测到库存操作意图，启动处理...')
        return await handleInventoryOperation(content)
      }
      
      // 1. 检测记账意图 — 如果用户想直接记一笔账，用AI解析后自动保存
      if (isAccountingIntent(content)) {
        log('检测到记账意图，启动AI解析...')
        return await handleAutoAccounting(content)
      }

      // 1. 构建本地数据上下文
      const { context: dataContext, relatedData } = await buildLocalDataContext(content)
      log('数据上下文长度:', dataContext.length)

      // 2. 加载记忆
      const memories = loadMemories()
      const memoryContext = memories.length > 0
        ? `\n【用户记忆档案】\n${memories.join('\n')}`
        : ''

      // 3. 构建系统提示词
      const systemPrompt = `你是"智能记账"系统的AI助手，名叫"小智"。你是一个专业、友好的财务小助手，专门服务于小微企业和个体工商户。

你的核心能力：
- 根据用户的记账数据回答财务问题（收入、支出、利润、趋势分析）
- 库存管理咨询（商品库存、补货建议）
- 税务政策解读和申报指引
- 记账方式指导（拍照记账、语音记账、模板录入）
- 经营分析和建议

回复规则：
1. 用通俗易懂的中文回答，避免专业术语
2. 金额数据用精确数字，不要编造数据
3. 回答要简洁实用，不超过300字
4. 如果数据不足以回答，诚实说明并给出建议
5. 适当给出经营建议和风险提示

以下是用户的实时业务数据：
${dataContext}
${memoryContext}

当前时间: ${new Date().toLocaleString('zh-CN')}
请基于以上真实数据回答用户问题。`

      // 4. 构建消息历史（最近10条）
      const recentHistory = history.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      const messages = [
        ...recentHistory,
        { role: 'user' as const, content },
      ]

      // 5. 调用大模型 API
      log('调用千帆API, 消息数:', messages.length)
      const resp = await fetch('/api/baidu/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, system: systemPrompt }),
      })
      const data = await resp.json()

      if (!resp.ok) {
        logError('API错误:', data)
        throw new Error(data.error?.message || '大模型服务暂时不可用')
      }

      const reply = data.reply || '抱歉，我暂时无法回答这个问题。'
      log('AI回复长度:', reply.length, '用量:', data.usage)

      // 6. 自动提取记忆
      const newFacts = extractMemorableFacts(content, reply)
      if (newFacts.length > 0) {
        const allMemories = [...memories, ...newFacts]
        saveMemories(allMemories)
        log('新增记忆:', newFacts)
      }

      return {
        id: generateId(),
        role: 'assistant',
        content: reply,
        timestamp: getNow(),
        relatedData,
      }
    } catch (err) {
      logError('发送消息异常:', err)
      // 降级到本地回复
      return createFallbackMessage(content)
    }
  },

  getMemories(): string[] {
    return loadMemories()
  },

  addMemory(fact: string): void {
    const memories = loadMemories()
    memories.push(fact)
    saveMemories(memories)
    log('手动添加记忆:', fact)
  },

  clearMemories(): void {
    saveMemories([])
    log('记忆已清空')
  },
}

/** 大模型不可用时的本地降级回复 */
async function createFallbackMessage(content: string): Promise<ChatMessage> {
  const lower = content.toLowerCase()
  let reply = ''
  let relatedData: ChatMessage['relatedData'] | undefined

  try {
    if (/支出|花了|花费/.test(lower)) {
      const records = await accountingService.getAll({ type: 'expense' })
      const total = records.reduce((s, r) => s + r.amount, 0)
      reply = `共 ${records.length} 笔支出，总计 ${formatCurrency(total)} 元。\n${records.slice(-5).map(r => `- ${r.date} ${r.description}: ${formatCurrency(r.amount)}元`).join('\n') || '暂无记录'}`
      relatedData = { type: 'record', items: records.slice(-5) }
    } else if (/收入|收了|赚/.test(lower)) {
      const records = await accountingService.getAll({ type: 'income' })
      const total = records.reduce((s, r) => s + r.amount, 0)
      reply = `共 ${records.length} 笔收入，总计 ${formatCurrency(total)} 元。\n${records.slice(-5).map(r => `- ${r.date} ${r.description}: ${formatCurrency(r.amount)}元`).join('\n') || '暂无记录'}`
      relatedData = { type: 'record', items: records.slice(-5) }
    } else if (/利润|盈亏/.test(lower)) {
      const now = new Date()
      const s = await accountingService.getMonthSummary(now.getFullYear(), now.getMonth() + 1)
      reply = `本月：收入 ${formatCurrency(s.income)} 元，支出 ${formatCurrency(s.expense)} 元，${s.profit >= 0 ? '盈利' : '亏损'} ${formatCurrency(Math.abs(s.profit))} 元`
      relatedData = { type: 'report', items: [s] }
    } else if (/库存|商品|补货/.test(lower)) {
      const alerts = await productService.getStockAlerts()
      if (alerts.length > 0) {
        reply = `${alerts.length} 个商品库存不足：\n${alerts.map(a => `- ${a.productName}：剩${a.currentStock}件`).join('\n')}`
      } else {
        reply = '库存情况正常，暂无预警。'
      }
      relatedData = { type: 'product', items: alerts }
    } else {
      reply = `我理解您的问题：「${content}」\n\n（AI大模型暂时不可用，已切换本地模式。我可以帮您查询收支、利润、库存等数据。）`
    }
  } catch {
    reply = '数据查询出错，请稍后重试。'
  }

  return { id: generateId(), role: 'assistant', content: reply, timestamp: getNow(), relatedData }
}
