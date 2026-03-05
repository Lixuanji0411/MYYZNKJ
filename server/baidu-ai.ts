import { Router, type Request, type Response } from 'express'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

function log(tag: string, ...args: unknown[]) {
  console.log(`[BaiduAI][${tag}] ${new Date().toISOString()}`, ...args)
}
function logError(tag: string, ...args: unknown[]) {
  console.error(`[BaiduAI][${tag}][ERROR] ${new Date().toISOString()}`, ...args)
}

interface TokenCache { token: string; expiresAt: number }
const tokenCacheMap: Record<string, TokenCache> = {}

async function getAccessToken(apiKey: string, secretKey: string, cacheKey: string): Promise<string> {
  const cached = tokenCacheMap[cacheKey]
  if (cached && Date.now() < cached.expiresAt) {
    log('Token', `${cacheKey} hit cache`)
    return cached.token
  }
  log('Token', `${cacheKey} fetching new token...`)
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
  const resp = await fetch(url, { method: 'POST' })
  const data = (await resp.json()) as Record<string, unknown>
  if (!data.access_token) {
    logError('Token', `${cacheKey} failed:`, data)
    throw new Error(`Token failed: ${data.error_description || data.error}`)
  }
  const expiresIn = data.expires_in as number
  tokenCacheMap[cacheKey] = { token: data.access_token as string, expiresAt: Date.now() + (expiresIn - 300) * 1000 }
  log('Token', `${cacheKey} ok, expires in ${expiresIn}s`)
  return data.access_token as string
}

// ==================== OCR ====================

router.post('/ocr/general', upload.single('image'), async (req: Request, res: Response) => {
  const t0 = Date.now()
  log('OCR', 'general request received')
  try {
    const { BAIDU_OCR_API_KEY: ak, BAIDU_OCR_SECRET_KEY: sk } = process.env
    if (!ak || !sk) { res.status(500).json({ error: 'OCR not configured' }); return }
    const token = await getAccessToken(ak, sk, 'ocr')
    let body: string
    if (req.file) {
      body = `image=${encodeURIComponent(req.file.buffer.toString('base64'))}`
      log('OCR', `file ${req.file.size} bytes`)
    } else if (req.body?.url) {
      body = `url=${encodeURIComponent(req.body.url)}`
    } else { res.status(400).json({ error: 'No image provided' }); return }
    const r = await fetch(`https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    })
    const d = await r.json()
    if (d.error_code) { logError('OCR', `fail ${Date.now() - t0}ms`, d); res.status(400).json(d); return }
    log('OCR', `ok ${Date.now() - t0}ms, ${d.words_result_num} lines`)
    res.json(d)
  } catch (e) { logError('OCR', e); res.status(500).json({ error: String(e) }) }
})

router.post('/ocr/receipt', upload.single('image'), async (req: Request, res: Response) => {
  const t0 = Date.now()
  log('OCR', 'receipt request received')
  try {
    const { BAIDU_OCR_API_KEY: ak, BAIDU_OCR_SECRET_KEY: sk } = process.env
    if (!ak || !sk) { res.status(500).json({ error: 'OCR not configured' }); return }
    const token = await getAccessToken(ak, sk, 'ocr')
    let body: string
    if (req.file) {
      body = `image=${encodeURIComponent(req.file.buffer.toString('base64'))}`
    } else if (req.body?.url) {
      body = `url=${encodeURIComponent(req.body.url)}`
    } else { res.status(400).json({ error: 'No image provided' }); return }
    const r = await fetch(`https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    })
    const d = await r.json()
    if (d.error_code) { logError('OCR', `receipt fail ${Date.now() - t0}ms`, d); res.status(400).json(d); return }
    log('OCR', `receipt ok ${Date.now() - t0}ms, ${d.words_result_num} lines`)
    res.json(d)
  } catch (e) { logError('OCR', e); res.status(500).json({ error: String(e) }) }
})

// ==================== Voice ====================

router.post('/voice/recognize', upload.single('audio'), async (req: Request, res: Response) => {
  const t0 = Date.now()
  log('Voice', 'recognize request received')
  try {
    const { BAIDU_VOICE_API_KEY: ak, BAIDU_VOICE_SECRET_KEY: sk } = process.env
    if (!ak || !sk) { res.status(500).json({ error: 'Voice not configured' }); return }
    const token = await getAccessToken(ak, sk, 'voice')
    if (!req.file) { res.status(400).json({ error: 'No audio provided' }); return }
    const audioBase64 = req.file.buffer.toString('base64')
    const format = req.body?.format || 'pcm'
    const rate = parseInt(req.body?.rate || '16000', 10)
    log('Voice', `audio ${req.file.size} bytes, format=${format}, rate=${rate}`)
    const payload = {
      format, rate, channel: 1, cuid: 'smart-ledger-server',
      token, speech: audioBase64, len: req.file.buffer.length,
      dev_pid: 1537,
    }
    // 百度语音识别API（文档: https://cloud.baidu.com/doc/SPEECH/s/Jlbxdezuf）
    const voiceApiUrl = 'http://vop.baidu.com/server_api'
    log('Voice', `calling ${voiceApiUrl}`)
    const r = await fetch(voiceApiUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    log('Voice', `response status=${r.status}, content-type=${r.headers.get('content-type')}`)
    const contentType = r.headers.get('content-type') || ''
    if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
      const rawText = await r.text()
      logError('Voice', `non-JSON response (${contentType}):`, rawText.slice(0, 200))
      res.status(502).json({ error: '百度语音API返回了非JSON响应，可能是网络或协议问题', detail: rawText.slice(0, 200) }); return
    }
    const d = (await r.json()) as Record<string, unknown>
    if (d.err_no !== 0) {
      logError('Voice', `fail ${Date.now() - t0}ms`, d)
      res.status(400).json({ error: d.err_msg, err_no: d.err_no }); return
    }
    const text = (d.result as string[])?.[0] || ''
    log('Voice', `ok ${Date.now() - t0}ms, text="${text}"`)
    res.json({ text, raw: d })
  } catch (e) { logError('Voice', e); res.status(500).json({ error: String(e) }) }
})

// ==================== LLM (Qianfan) ====================

router.post('/llm/chat', async (req: Request, res: Response) => {
  const t0 = Date.now()
  log('LLM', 'chat request received')
  try {
    const apiKey = process.env.BAIDU_QIANFAN_API_KEY
    const model = process.env.BAIDU_QIANFAN_MODEL || 'ernie-lite-pro-128k'
    if (!apiKey) { res.status(500).json({ error: 'LLM not configured' }); return }
    const { messages, system } = req.body as { messages: Array<{ role: string; content: string }>; system?: string }
    if (!messages?.length) { res.status(400).json({ error: 'No messages' }); return }
    log('LLM', `model=${model}, messages=${messages.length}, system=${system ? 'yes' : 'no'}`)
    const payload: Record<string, unknown> = { model, messages }
    if (system) {
      payload.messages = [{ role: 'system', content: system }, ...messages]
    }
    const r = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const d = (await r.json()) as Record<string, unknown>
    if (d.error) {
      logError('LLM', `fail ${Date.now() - t0}ms`, d)
      res.status(400).json(d); return
    }
    const choices = d.choices as Array<{ message: { content: string } }>
    const reply = choices?.[0]?.message?.content || ''
    log('LLM', `ok ${Date.now() - t0}ms, reply length=${reply.length}, usage=`, d.usage)
    res.json({ reply, usage: d.usage, raw: d })
  } catch (e) { logError('LLM', e); res.status(500).json({ error: String(e) }) }
})

export default router
