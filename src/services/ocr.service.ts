import type { OcrResult } from '@/types/accounting'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/config/categories'

export interface OcrServiceInterface {
  recognizeInvoice(imageFile: File): Promise<OcrResult>
  recognizeBankStatement(imageFile: File): Promise<Array<{ date: string; amount: number; type: 'income' | 'expense'; description: string }>>
}

function log(...args: unknown[]) { console.log('[OCR]', ...args) }
function logError(...args: unknown[]) { console.error('[OCR][ERROR]', ...args) }

/** 调用AI大模型智能解析OCR文本 */
async function aiParseOcrText(lines: string[]): Promise<OcrResult | null> {
  const fullText = lines.join('\n')
  const systemPrompt = `你是一个票据/发票/收据智能解析助手。用户会给你OCR识别出的文本行，你需要从中提取结构化数据。

请严格按以下JSON格式返回（不要返回任何其他文字，只返回JSON）：
{
  "amount": 总金额数字,
  "date": "YYYY-MM-DD格式日期",
  "vendor": "商户/店铺名称",
  "type": "income 或 expense",
  "category": "分类名称",
  "items": [{"name": "商品名", "quantity": 数量, "price": 单价}],
  "description": "简短描述（不超过20字）",
  "confidence": 0到1之间的置信度
}

判断规则：
- amount: 找票据上的合计/总计/实付金额，取最终支付金额
- date: 提取日期，如果没有则返回null
- vendor: 提取商户/公司/店铺名
- type: 票据通常代表"expense"（支出），除非明确是收款凭证
- category 从以下列表中选择：
  收入类: ${INCOME_CATEGORIES.join('、')}
  支出类: ${EXPENSE_CATEGORIES.join('、')}
- items: 提取商品明细
- 如果无法确定某个字段，对应值设为null`

  try {
    const resp = await fetch('/api/baidu/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `以下是OCR识别出的票据文本：\n${fullText}` }],
        system: systemPrompt,
      }),
    })

    if (!resp.ok) return null

    const data = await resp.json()
    const reply: string = data.reply || ''
    const jsonMatch = reply.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    log('AI解析OCR结果:', parsed)

    return {
      amount: typeof parsed.amount === 'number' ? parsed.amount : undefined,
      date: typeof parsed.date === 'string' ? parsed.date : undefined,
      vendor: typeof parsed.vendor === 'string' ? parsed.vendor : undefined,
      items: Array.isArray(parsed.items) ? parsed.items : undefined,
      rawText: fullText,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      // 扩展字段通过rawText传递category/type/description给调用方
    }
  } catch (err) {
    logError('AI解析OCR失败，降级到正则:', err)
    return null
  }
}

/** 从 OCR 原始文本行中智能提取金额、日期、商品名（降级方案） */
function parseOcrLines(lines: string[]): OcrResult {
  const fullText = lines.join('\n')
  log('原始文本:', fullText)

  let amount: number | undefined
  let date: string | undefined
  let vendor: string | undefined
  const items: Array<{ name: string; quantity?: number; price?: number }> = []

  for (const line of lines) {
    // 提取金额 (优先大金额, 如 ¥1280.00 / 合计 1280 / 金额 1280.00)
    const amountMatch = line.match(/[¥￥]?\s*(\d+[.,]\d{2})\s*(?:元|$)/i)
      || line.match(/(?:合计|总计|金额|小计|实付|应付)[：:\s]*[¥￥]?\s*(\d+\.?\d*)/i)
    if (amountMatch) {
      const parsed = parseFloat(amountMatch[1].replace(',', ''))
      if (!amount || parsed > amount) amount = parsed
    }

    // 提取日期
    const dateMatch = line.match(/(\d{4})[年/\-.](\d{1,2})[月/\-.](\d{1,2})/)
    if (dateMatch) {
      date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
    }

    // 提取商户/供应商名
    const vendorMatch = line.match(/(?:商户|店铺|公司|商家)[名称：:\s]*(.+)/i)
    if (vendorMatch) vendor = vendorMatch[1].trim()

    // 提取商品行 (名称 x数量 @价格)
    const itemMatch = line.match(/^(.{2,20})\s+[xX×]\s*(\d+)\s+[¥￥@]?\s*(\d+\.?\d*)/)
    if (itemMatch) {
      items.push({ name: itemMatch[1].trim(), quantity: parseInt(itemMatch[2]), price: parseFloat(itemMatch[3]) })
    }
  }

  // 如果未提取到商品但有文本，把前几行作为描述
  if (items.length === 0 && lines.length > 0) {
    const nameLines = lines.filter(l => l.length > 1 && l.length < 30 && !/^\d/.test(l))
    if (nameLines.length > 0) items.push({ name: nameLines[0] })
  }

  return {
    amount,
    date: date || new Date().toISOString().split('T')[0],
    items,
    vendor,
    rawText: fullText,
    confidence: amount ? 0.85 : 0.4,
  }
}

type BankStatementEntry = { date: string; amount: number; type: 'income' | 'expense'; description: string }

/** 调用AI大模型智能解析银行流水OCR文本 */
async function aiParseBankStatementText(lines: string[]): Promise<BankStatementEntry[] | null> {
  const fullText = lines.join('\n')
  const systemPrompt = `你是一个银行流水/账单智能解析助手。用户会给你OCR识别出的文本行，你需要从中提取每一笔交易记录。

请严格按以下JSON数组格式返回（不要返回任何其他文字，只返回JSON数组）：
[
  {
    "date": "YYYY-MM-DD格式日期",
    "amount": 金额数字(正数),
    "type": "income 或 expense",
    "description": "交易描述(不超过30字)"
  }
]

判断规则：
- 每一笔交易提取为一个对象
- amount 始终为正数
- type: 收入/收款/入账/贷方 → "income"；支出/付款/转出/借方/费用 → "expense"
- 如果金额前有 + 号或无符号且描述含收款/销售等 → income
- 如果金额前有 - 号或描述含费用/采购/付款等 → expense
- date: 提取日期，如果某行没有日期则沿用上一行的日期，如果都没有则用null
- description: 提取交易摘要/描述，去掉金额和日期部分
- 忽略表头行、合计行、余额行等非交易行
- 如果无法识别出任何交易记录，返回空数组 []`

  try {
    const resp = await fetch('/api/baidu/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `以下是OCR识别出的银行流水/账单文本：\n${fullText}` }],
        system: systemPrompt,
      }),
    })

    if (!resp.ok) {
      log('AI银行流水解析API调用失败:', resp.status)
      return null
    }

    const data = await resp.json()
    const reply: string = data.reply || ''
    const jsonMatch = reply.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      log('AI返回内容无法提取JSON数组:', reply.slice(0, 200))
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>
    const today = new Date().toISOString().split('T')[0]
    const results: BankStatementEntry[] = []

    for (const item of parsed) {
      const amount = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount))
      if (!amount || amount <= 0) continue
      results.push({
        date: typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : today,
        amount,
        type: item.type === 'income' ? 'income' : 'expense',
        description: typeof item.description === 'string' ? item.description : '银行流水',
      })
    }

    log('AI银行流水解析结果:', results)
    return results.length > 0 ? results : null
  } catch (err) {
    logError('AI银行流水解析异常，将降级到正则:', err)
    return null
  }
}

/** 增强正则解析银行流水文本行（降级方案） */
function regexParseBankLines(lines: string[]): BankStatementEntry[] {
  const results: BankStatementEntry[] = []
  const today = new Date().toISOString().split('T')[0]

  for (const line of lines) {
    // 增强金额正则：支持 3200 / 3200.00 / 3,200.00 / ¥3200 / +3200 / -280.00
    const amtMatch = line.match(/([+-]?)\s*[¥￥]?\s*(\d{1,3}(?:[,，]\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?:\s*元)?/)
    if (amtMatch && amtMatch[2]) {
      const rawAmt = amtMatch[2].replace(/[,，]/g, '')
      const amount = parseFloat(rawAmt)
      if (!amount || amount <= 0) continue
      // 过滤掉过小的数（可能是序号或日期中的数字）
      if (amount < 1) continue

      const sign = amtMatch[1]
      const isExpense = sign === '-' || /支出|付款|转出|借方|费用|采购|快递/.test(line)
      const isIncome = sign === '+' || /收入|收款|入账|贷方|销售|回款/.test(line)

      // 提取日期
      const dateMatch = line.match(/(\d{4})[年/\-.](\d{1,2})[月/\-.](\d{1,2})/)
      const date = dateMatch
        ? `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
        : today

      // 提取描述：移除日期和金额部分
      let desc = line
        .replace(/\d{4}[年/\-.]?\d{1,2}[月/\-.]?\d{1,2}[日]?/g, '')
        .replace(/[+-]?\s*[¥￥]?\s*\d{1,3}(?:[,，]\d{3})*(?:\.\d{1,2})?(?:\s*元)?/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      if (!desc || desc.length < 2) desc = '银行流水'

      results.push({
        date,
        amount,
        type: isExpense ? 'expense' : (isIncome ? 'income' : 'expense'),
        description: desc,
      })
    }
  }

  log(`正则解析出 ${results.length} 条流水记录`)
  return results
}

export const ocrService: OcrServiceInterface = {
  async recognizeInvoice(imageFile: File): Promise<OcrResult> {
    log('开始发票识别, 文件:', imageFile.name, imageFile.size, 'bytes')
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      const resp = await fetch('/api/baidu/ocr/general', { method: 'POST', body: formData })
      const data = await resp.json()
      if (!resp.ok) {
        logError('API 返回错误:', data)
        throw new Error(data.error || 'OCR 识别失败')
      }
      const lines: string[] = (data.words_result || []).map((w: { words: string }) => w.words)
      log(`识别到 ${lines.length} 行文字`)

      // 优先用AI大模型智能解析
      const aiResult = await aiParseOcrText(lines)
      if (aiResult && aiResult.amount) {
        log('AI解析成功，使用AI结果')
        return aiResult
      }

      // AI解析失败时降级到正则
      log('AI解析未返回有效结果，降级到正则解析')
      return parseOcrLines(lines)
    } catch (err) {
      logError('发票识别异常:', err)
      throw err
    }
  },

  async recognizeBankStatement(imageFile: File): Promise<Array<{ date: string; amount: number; type: 'income' | 'expense'; description: string }>> {
    log('开始银行流水识别, 文件:', imageFile.name)
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      const resp = await fetch('/api/baidu/ocr/general', { method: 'POST', body: formData })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'OCR 识别失败')

      const lines: string[] = (data.words_result || []).map((w: { words: string }) => w.words)
      log(`OCR识别到 ${lines.length} 行文字:`, lines)

      if (lines.length === 0) return []

      // 优先用AI大模型智能解析银行流水
      const aiResult = await aiParseBankStatementText(lines)
      if (aiResult && aiResult.length > 0) {
        log(`AI解析成功，识别出 ${aiResult.length} 条流水`)
        return aiResult
      }

      // AI解析失败时降级到增强正则解析
      log('AI解析未返回有效结果，降级到正则解析')
      return regexParseBankLines(lines)
    } catch (err) {
      logError('银行流水识别异常:', err)
      throw err
    }
  },
}
