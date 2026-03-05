import { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  decimals?: number
}

export function AnimatedNumber({
  value,
  duration = 0.8,
  className,
  prefix = '',
  suffix = '',
  decimals = 2,
}: AnimatedNumberProps) {
  const spring = useSpring(0, { duration: duration * 1000 })
  const display = useTransform(spring, (current) =>
    `${prefix}${Math.abs(current).toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`
  )

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span className={className}>{display}</motion.span>
}

interface StatChangeProps {
  value: number
  className?: string
}

export function StatChange({ value, className }: StatChangeProps) {
  const isPositive = value >= 0

  return (
    <span
      className={`inline-flex items-center text-xs font-medium ${
        isPositive ? 'text-income' : 'text-expense'
      } ${className || ''}`}
    >
      {isPositive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  )
}
