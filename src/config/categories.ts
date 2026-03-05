import type { CategoryMapping, AccountingTemplate } from '@/types/accounting'

export const DEFAULT_CATEGORY_MAPPINGS: CategoryMapping[] = [
  { keyword: '进货', category: '采购成本', type: 'expense', weight: 10 },
  { keyword: '采购', category: '采购成本', type: 'expense', weight: 10 },
  { keyword: '进料', category: '采购成本', type: 'expense', weight: 8 },
  { keyword: '原材料', category: '采购成本', type: 'expense', weight: 8 },
  { keyword: '销售', category: '销售收入', type: 'income', weight: 10 },
  { keyword: '卖', category: '销售收入', type: 'income', weight: 8 },
  { keyword: '收款', category: '销售收入', type: 'income', weight: 9 },
  { keyword: '房租', category: '租赁费用', type: 'expense', weight: 10 },
  { keyword: '租金', category: '租赁费用', type: 'expense', weight: 10 },
  { keyword: '水电', category: '水电费', type: 'expense', weight: 10 },
  { keyword: '电费', category: '水电费', type: 'expense', weight: 9 },
  { keyword: '水费', category: '水电费', type: 'expense', weight: 9 },
  { keyword: '工资', category: '人工成本', type: 'expense', weight: 10 },
  { keyword: '薪资', category: '人工成本', type: 'expense', weight: 9 },
  { keyword: '社保', category: '人工成本', subcategory: '社保', type: 'expense', weight: 9 },
  { keyword: '运费', category: '物流费用', type: 'expense', weight: 10 },
  { keyword: '快递', category: '物流费用', type: 'expense', weight: 9 },
  { keyword: '物流', category: '物流费用', type: 'expense', weight: 9 },
  { keyword: '餐饮', category: '业务招待费', type: 'expense', weight: 8 },
  { keyword: '招待', category: '业务招待费', type: 'expense', weight: 9 },
  { keyword: '请客', category: '业务招待费', type: 'expense', weight: 8 },
  { keyword: '餐票', category: '业务招待费', type: 'expense', weight: 9 },
  { keyword: '打车', category: '交通费', type: 'expense', weight: 9 },
  { keyword: '出租车', category: '交通费', type: 'expense', weight: 9 },
  { keyword: '加油', category: '交通费', subcategory: '油费', type: 'expense', weight: 9 },
  { keyword: '停车', category: '交通费', subcategory: '停车费', type: 'expense', weight: 9 },
  { keyword: '办公', category: '办公费用', type: 'expense', weight: 8 },
  { keyword: '文具', category: '办公费用', type: 'expense', weight: 8 },
  { keyword: '打印', category: '办公费用', type: 'expense', weight: 8 },
  { keyword: '电话', category: '通讯费', type: 'expense', weight: 9 },
  { keyword: '话费', category: '通讯费', type: 'expense', weight: 9 },
  { keyword: '网费', category: '通讯费', type: 'expense', weight: 9 },
  { keyword: '维修', category: '维修费', type: 'expense', weight: 9 },
  { keyword: '修理', category: '维修费', type: 'expense', weight: 8 },
  { keyword: '利息', category: '财务费用', subcategory: '利息收入', type: 'income', weight: 9 },
  { keyword: '银行手续费', category: '财务费用', subcategory: '手续费', type: 'expense', weight: 10 },
  { keyword: '转账', category: '其他收入', type: 'income', weight: 5 },
  { keyword: '退款', category: '销售退回', type: 'expense', weight: 9 },
]

export const EXPENSE_CATEGORIES = [
  '采购成本',
  '租赁费用',
  '水电费',
  '人工成本',
  '物流费用',
  '业务招待费',
  '交通费',
  '办公费用',
  '通讯费',
  '维修费',
  '财务费用',
  '折旧费',
  '税金',
  '保险费',
  '广告费',
  '销售退回',
  '其他支出',
]

export const INCOME_CATEGORIES = [
  '销售收入',
  '服务收入',
  '利息收入',
  '租金收入',
  '补贴收入',
  '其他收入',
]

export const DEFAULT_TEMPLATES: AccountingTemplate[] = [
  {
    id: 'tpl_sales',
    name: '销售收款',
    icon: 'ShoppingBag',
    type: 'income',
    category: '销售收入',
    description: '商品销售收入',
  },
  {
    id: 'tpl_purchase',
    name: '采购付款',
    icon: 'Package',
    type: 'expense',
    category: '采购成本',
    description: '商品采购支出',
  },
  {
    id: 'tpl_rent',
    name: '房租支出',
    icon: 'Home',
    type: 'expense',
    category: '租赁费用',
    description: '店铺/办公场所租金',
  },
  {
    id: 'tpl_utility',
    name: '水电费',
    icon: 'Zap',
    type: 'expense',
    category: '水电费',
    description: '水费、电费、燃气费',
  },
  {
    id: 'tpl_salary',
    name: '工资发放',
    icon: 'Users',
    type: 'expense',
    category: '人工成本',
    description: '员工工资及社保',
  },
  {
    id: 'tpl_shipping',
    name: '运费支出',
    icon: 'Truck',
    type: 'expense',
    category: '物流费用',
    description: '快递及物流运费',
  },
  {
    id: 'tpl_service',
    name: '服务收入',
    icon: 'Briefcase',
    type: 'income',
    category: '服务收入',
    description: '提供服务获得的收入',
  },
  {
    id: 'tpl_entertain',
    name: '业务招待',
    icon: 'Coffee',
    type: 'expense',
    category: '业务招待费',
    description: '客户招待、商务宴请',
  },
]

export function matchCategory(
  description: string,
  customMappings: CategoryMapping[] = []
): { category: string; subcategory?: string; type: RecordType; confidence: number } | null {
  const allMappings = [...customMappings, ...DEFAULT_CATEGORY_MAPPINGS]
    .sort((a, b) => b.weight - a.weight)

  for (const mapping of allMappings) {
    if (description.includes(mapping.keyword)) {
      return {
        category: mapping.category,
        subcategory: mapping.subcategory,
        type: mapping.type,
        confidence: mapping.weight / 10,
      }
    }
  }

  return null
}

type RecordType = 'income' | 'expense'
