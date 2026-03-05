import { useEffect, useRef } from 'react'

interface AudioWaveformProps {
  isActive: boolean
  barCount?: number
  className?: string
}

export function AudioWaveform({ isActive, barCount = 32, className = '' }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isActive) {
      cancelAnimationFrame(animFrameRef.current)
      analyserRef.current = null
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      // Draw idle bars
      drawIdleBars()
      return
    }

    let mounted = true

    async function startAnalysis() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        const ctx = new AudioContext()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 128
        analyser.smoothingTimeConstant = 0.7
        source.connect(analyser)
        analyserRef.current = analyser
        drawFrame()
      } catch {
        drawIdleBars()
      }
    }

    function drawFrame() {
      if (!mounted || !analyserRef.current) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const analyser = analyserRef.current
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)

      const w = canvas.width
      const h = canvas.height
      const barW = Math.max(2, (w / barCount) * 0.6)
      const gap = (w - barW * barCount) / (barCount - 1)

      ctx.clearRect(0, 0, w, h)

      for (let i = 0; i < barCount; i++) {
        const dataIdx = Math.floor((i / barCount) * data.length)
        const val = data[dataIdx] / 255
        const barH = Math.max(3, val * h * 0.85)

        const x = i * (barW + gap)
        const y = (h - barH) / 2

        // Gradient from primary to accent
        const t = i / barCount
        const r = Math.round(168 + t * 20)
        const g = Math.round(100 - t * 15)
        const b = Math.round(80 + t * 10)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.6 + val * 0.4})`
        ctx.beginPath()
        ctx.roundRect(x, y, barW, barH, barW / 2)
        ctx.fill()
      }

      animFrameRef.current = requestAnimationFrame(drawFrame)
    }

    startAnalysis()
    return () => {
      mounted = false
      cancelAnimationFrame(animFrameRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [isActive, barCount])

  function drawIdleBars() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const barW = Math.max(2, (w / barCount) * 0.6)
    const gap = (w - barW * barCount) / (barCount - 1)

    ctx.clearRect(0, 0, w, h)

    for (let i = 0; i < barCount; i++) {
      const barH = 3
      const x = i * (barW + gap)
      const y = (h - barH) / 2
      ctx.fillStyle = 'rgba(168, 100, 80, 0.2)'
      ctx.beginPath()
      ctx.roundRect(x, y, barW, barH, barW / 2)
      ctx.fill()
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={64}
      className={`w-full max-w-xs ${className}`}
      style={{ imageRendering: 'auto' }}
    />
  )
}
