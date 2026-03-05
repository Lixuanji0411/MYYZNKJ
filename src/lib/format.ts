import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function formatCurrency(value: number, showSign = false): string {
  const formatted = Math.abs(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (showSign) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`
  }

  return formatted
}

export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }
  return formatCurrency(value)
}

export function formatDate(dateStr: string, pattern = 'yyyy-MM-dd'): string {
  try {
    return format(parseISO(dateStr), pattern, { locale: zhCN })
  } catch {
    return dateStr
  }
}

export function formatRelativeDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    if (isToday(date)) return '今天'
    if (isYesterday(date)) return '昨天'
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'yyyy-MM-dd HH:mm', { locale: zhCN })
  } catch {
    return dateStr
  }
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}
