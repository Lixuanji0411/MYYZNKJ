import type { VoiceParseResult, RecordType } from '@/types/accounting'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/config/categories'

function log(...args: unknown[]) { console.log('[AI-Parse]', ...args) }
function logError(...args: unknown[]) { console.error('[AI-Parse][ERROR]', ...args) }

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

/**
 * 调用AI大模型智能解析自然语言文本，提取结构化记账数据
 * 用于语音识别结果解析、AI聊天记账等场景
 */
export async function aiParseAccountingText(text: string): Promise<VoiceParseResult> {
  log('开始AI解析:', text)

  const systemPrompt = `你是一个记账数据提取助手。用户会给你一段自然语言描述（可能来自语音识别），你需要从中提取结构化的记账信息。

请严格按以下JSON格式返回（不要返回任何其他文字，只返回JSON）：
{
  "type": "income 或 expense",
  "amount": 数字金额,
  "description": "简短的交易描述（不超过20字）",
  "category": "分类名称",
  "productName": "商品名称（如有）",
  "quantity": 数量（如有，否则null）,
  "time": "HH:mm格式时间（如用户提到了具体时间，如'上午10点'→'10:00'，'下午3点半'→'15:30'，否则null）",
  "confidence": 0到1之间的置信度
}

判断规则：
- "卖出""收入""收款""营业额" → type 为 "income"
- "买了""花了""支出""付款""采购" → type 为 "expense"  
- 注意区分：用户说"卖出了三个苹果"是收入（卖东西赚钱），不是支出
- 金额：提取所有提到的金额，取总金额（如"一共60块"取60，如"每个20块卖了3个"取60）
- 中文数字要转换：三→3, 五十→50, 一百→100
- description 要简洁，如"卖出苹果3个"而不是复述原文
- category 必须从以下列表中选择：
  收入类: ${INCOME_CATEGORIES.join('、')}
  支出类: ${EXPENSE_CATEGORIES.join('、')}
- 如果无法确定某个字段，对应值设为null

示例：
输入："我刚刚卖出了三个苹果一共60块钱每个20块帮我记账"
输出：{"type":"income","amount":60,"description":"卖出苹果3个","category":"销售收入","productName":"苹果","quantity":3,"confidence":0.95}

输入："今天花了200块买了一箱橘子"
输出：{"type":"expense","amount":200,"description":"采购橘子1箱","category":"采购成本","productName":"橘子","quantity":1,"confidence":0.9}

输入："交了这个月房租3000"
输出：{"type":"expense","amount":3000,"description":"本月房租","category":"租赁费用","productName":null,"quantity":null,"time":null,"confidence":0.95}

输入："今天上午10点卖了一箱苹果收了200"
输出：{"type":"income","amount":200,"description":"卖出苹果1箱","category":"销售收入","productName":"苹果","quantity":1,"time":"10:00","confidence":0.95}`

  try {
    const resp = await fetch('/api/baidu/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: text }],
        system: systemPrompt,
      }),
    })

    if (!resp.ok) {
      logError('AI解析API错误:', resp.status)
      return fallbackParse(text)
    }

    const data = await resp.json()
    const reply: string = data.reply || ''
    log('AI原始回复:', reply)

    // 从回复中提取JSON（可能被markdown包裹）
    const jsonMatch = reply.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      logError('AI回复中未找到JSON:', reply)
      return fallbackParse(text)
    }

    const parsed = JSON.parse(jsonMatch[0])
    log('AI解析结果:', parsed)

    // 校验并规范化结果
    const result: VoiceParseResult = {
      rawText: text,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
    }

    if (parsed.type === 'income' || parsed.type === 'expense') {
      result.type = parsed.type as RecordType
    }
    if (typeof parsed.amount === 'number' && parsed.amount > 0) {
      result.amount = parsed.amount
    }
    if (typeof parsed.description === 'string' && parsed.description.trim()) {
      result.description = parsed.description.trim()
    }
    if (typeof parsed.category === 'string' && ALL_CATEGORIES.includes(parsed.category)) {
      result.category = parsed.category
    }
    if (typeof parsed.productName === 'string' && parsed.productName.trim()) {
      result.productName = parsed.productName.trim()
    }
    if (typeof parsed.quantity === 'number' && parsed.quantity > 0) {
      result.quantity = parsed.quantity
    }
    if (typeof parsed.time === 'string' && /^\d{2}:\d{2}$/.test(parsed.time)) {
      result.time = parsed.time
    }

    log('最终解析结果:', result)
    return result
  } catch (err) {
    logError('AI解析异常:', err)
    return fallbackParse(text)
  }
}

/**
 * AI不可用时的本地降级解析（增强版正则）
 */
function fallbackParse(text: string): VoiceParseResult {
  log('使用本地降级解析')
  const result: VoiceParseResult = {
    rawText: text,
    description: text,
    confidence: 0.4,
  }

  // 判断收入/支出
  if (/卖|收入|收款|营业|收了/.test(text)) {
    result.type = 'income'
    result.category = '销售收入'
  } else if (/买|花了|支出|付款|采购|交了|缴/.test(text)) {
    result.type = 'expense'
    result.category = '其他支出'
  }

  // 提取金额 - 支持"60块""60元""60块钱"等
  const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:块钱|块|元|万元|千元|角|毛)/)
  if (amountMatch) {
    let amount = parseFloat(amountMatch[1])
    if (/万元/.test(amountMatch[0])) amount *= 10000
    if (/千元/.test(amountMatch[0])) amount *= 1000
    result.amount = amount
    result.confidence = 0.6
  }

  // 提取"一共XX"格式的金额（优先级更高）
  const totalMatch = text.match(/一共\s*(\d+(?:\.\d+)?)\s*(?:块钱|块|元)?/)
  if (totalMatch) {
    result.amount = parseFloat(totalMatch[1])
    result.confidence = 0.7
  }

  // 提取时间
  const timeMatch = text.match(/(\d{1,2})[点时](\d{1,2})?[分]?/)
  if (timeMatch) {
    const h = parseInt(timeMatch[1])
    const m = parseInt(timeMatch[2] || '0')
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      result.time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
  }

  return result
}
