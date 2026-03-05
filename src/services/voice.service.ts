import type { VoiceParseResult } from '@/types/accounting'
import { aiParseAccountingText } from './ai-parse.service'

export interface VoiceServiceInterface {
  startRecording(): Promise<void>
  stopRecording(): Promise<Blob>
  parseVoiceText(text: string): Promise<VoiceParseResult>
  transcribe(audioBlob: Blob): Promise<string>
  isRecording(): boolean
}

function log(...args: unknown[]) { console.log('[Voice]', ...args) }
function logError(...args: unknown[]) { console.error('[Voice][ERROR]', ...args) }

let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let recording = false

export const voiceService: VoiceServiceInterface = {
  isRecording(): boolean {
    return recording
  },

  async startRecording(): Promise<void> {
    log('请求麦克风权限...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } })
      audioChunks = []
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data) }
      mediaRecorder.start(100)
      recording = true
      log('录音已开始')
    } catch (err) {
      logError('麦克风权限获取失败:', err)
      throw new Error('无法访问麦克风，请检查浏览器权限设置')
    }
  },

  async stopRecording(): Promise<Blob> {
    log('停止录音...')
    return new Promise((resolve, reject) => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        recording = false
        reject(new Error('没有正在进行的录音'))
        return
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' })
        log('录音完成, 大小:', blob.size, 'bytes')
        mediaRecorder?.stream.getTracks().forEach(t => t.stop())
        mediaRecorder = null
        recording = false
        resolve(blob)
      }
      mediaRecorder.stop()
    })
  },

  async transcribe(audioBlob: Blob): Promise<string> {
    log('开始语音转文字, 音频大小:', audioBlob.size, 'bytes')
    try {
      // 将 webm 转为 pcm 需要 AudioContext 解码
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioCtx = new AudioContext({ sampleRate: 16000 })
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      const channelData = audioBuffer.getChannelData(0)

      // 转为 16bit PCM
      const pcmBuffer = new ArrayBuffer(channelData.length * 2)
      const pcmView = new DataView(pcmBuffer)
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]))
        pcmView.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      }
      const pcmBlob = new Blob([pcmBuffer], { type: 'audio/pcm' })
      log('PCM 转换完成, 大小:', pcmBlob.size, 'bytes')

      const formData = new FormData()
      formData.append('audio', pcmBlob, 'audio.pcm')
      formData.append('format', 'pcm')
      formData.append('rate', '16000')

      const resp = await fetch('/api/baidu/voice/recognize', { method: 'POST', body: formData })
      if (!resp.ok) {
        let errMsg = `语音识别失败 (${resp.status})`
        try {
          const errData = await resp.json()
          logError('语音识别API错误:', errData)
          errMsg = errData.error || errData.detail || errMsg
        } catch {
          const rawText = await resp.text()
          logError('语音识别API返回非JSON:', rawText.slice(0, 200))
        }
        throw new Error(errMsg)
      }
      const data = await resp.json()
      log('语音识别结果:', data.text)
      await audioCtx.close()
      return data.text || ''
    } catch (err) {
      logError('语音转文字异常:', err)
      throw err
    }
  },

  async parseVoiceText(text: string): Promise<VoiceParseResult> {
    log('调用AI大模型智能解析语音文本:', text)
    return aiParseAccountingText(text)
  },
}
