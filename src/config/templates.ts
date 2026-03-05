import type { QuickPrompt } from '@/types/chat'

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'qp_monthly_expense',
    icon: 'PieChart',
    label: '本月支出分析',
    prompt: '帮我分析一下本月的支出情况，按类别统计',
  },
  {
    id: 'qp_income_trend',
    icon: 'TrendingUp',
    label: '收入趋势',
    prompt: '展示最近3个月的收入趋势',
  },
  {
    id: 'qp_search_record',
    icon: 'Search',
    label: '查找记录',
    prompt: '帮我查找',
  },
  {
    id: 'qp_stock_alert',
    icon: 'AlertTriangle',
    label: '库存预警',
    prompt: '当前有哪些商品库存不足需要补货？',
  },
  {
    id: 'qp_tax_reminder',
    icon: 'Calendar',
    label: '报税提醒',
    prompt: '下次需要报税是什么时候？需要准备什么？',
  },
  {
    id: 'qp_profit',
    icon: 'DollarSign',
    label: '利润情况',
    prompt: '帮我算一下本月的利润情况',
  },
]
