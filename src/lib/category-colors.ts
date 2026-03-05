/**
 * 分类颜色映射 - 为每个分类赋予独特的、视觉强烈的颜色
 * 用于Badge背景、图标底色等，确保一眼可辨识
 */

const CATEGORY_COLOR_MAP: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  // ── 收入类 ──
  '销售收入':   { bg: 'bg-emerald-100',  text: 'text-emerald-700',  darkBg: 'dark:bg-emerald-900/40',  darkText: 'dark:text-emerald-300' },
  '服务收入':   { bg: 'bg-teal-100',     text: 'text-teal-700',     darkBg: 'dark:bg-teal-900/40',     darkText: 'dark:text-teal-300' },
  '利息收入':   { bg: 'bg-cyan-100',     text: 'text-cyan-700',     darkBg: 'dark:bg-cyan-900/40',     darkText: 'dark:text-cyan-300' },
  '租金收入':   { bg: 'bg-green-100',    text: 'text-green-700',    darkBg: 'dark:bg-green-900/40',    darkText: 'dark:text-green-300' },
  '补贴收入':   { bg: 'bg-lime-100',     text: 'text-lime-700',     darkBg: 'dark:bg-lime-900/40',     darkText: 'dark:text-lime-300' },
  '其他收入':   { bg: 'bg-emerald-50',   text: 'text-emerald-600',  darkBg: 'dark:bg-emerald-900/30',  darkText: 'dark:text-emerald-400' },

  // ── 支出类 ──
  '采购成本':   { bg: 'bg-orange-100',   text: 'text-orange-700',   darkBg: 'dark:bg-orange-900/40',   darkText: 'dark:text-orange-300' },
  '租赁费用':   { bg: 'bg-violet-100',   text: 'text-violet-700',   darkBg: 'dark:bg-violet-900/40',   darkText: 'dark:text-violet-300' },
  '水电费':     { bg: 'bg-blue-100',     text: 'text-blue-700',     darkBg: 'dark:bg-blue-900/40',     darkText: 'dark:text-blue-300' },
  '人工成本':   { bg: 'bg-pink-100',     text: 'text-pink-700',     darkBg: 'dark:bg-pink-900/40',     darkText: 'dark:text-pink-300' },
  '物流费用':   { bg: 'bg-amber-100',    text: 'text-amber-700',    darkBg: 'dark:bg-amber-900/40',    darkText: 'dark:text-amber-300' },
  '业务招待费': { bg: 'bg-rose-100',     text: 'text-rose-700',     darkBg: 'dark:bg-rose-900/40',     darkText: 'dark:text-rose-300' },
  '交通费':     { bg: 'bg-sky-100',      text: 'text-sky-700',      darkBg: 'dark:bg-sky-900/40',      darkText: 'dark:text-sky-300' },
  '办公费用':   { bg: 'bg-slate-100',    text: 'text-slate-700',    darkBg: 'dark:bg-slate-800/50',    darkText: 'dark:text-slate-300' },
  '办公费':     { bg: 'bg-slate-100',    text: 'text-slate-700',    darkBg: 'dark:bg-slate-800/50',    darkText: 'dark:text-slate-300' },
  '通讯费':     { bg: 'bg-indigo-100',   text: 'text-indigo-700',   darkBg: 'dark:bg-indigo-900/40',   darkText: 'dark:text-indigo-300' },
  '维修费':     { bg: 'bg-yellow-100',   text: 'text-yellow-700',   darkBg: 'dark:bg-yellow-900/40',   darkText: 'dark:text-yellow-300' },
  '财务费用':   { bg: 'bg-purple-100',   text: 'text-purple-700',   darkBg: 'dark:bg-purple-900/40',   darkText: 'dark:text-purple-300' },
  '折旧费':     { bg: 'bg-stone-100',    text: 'text-stone-700',    darkBg: 'dark:bg-stone-800/50',    darkText: 'dark:text-stone-300' },
  '税金':       { bg: 'bg-red-100',      text: 'text-red-700',      darkBg: 'dark:bg-red-900/40',      darkText: 'dark:text-red-300' },
  '保险费':     { bg: 'bg-fuchsia-100',  text: 'text-fuchsia-700',  darkBg: 'dark:bg-fuchsia-900/40',  darkText: 'dark:text-fuchsia-300' },
  '广告费':     { bg: 'bg-cyan-100',     text: 'text-cyan-700',     darkBg: 'dark:bg-cyan-900/40',     darkText: 'dark:text-cyan-300' },
  '销售退回':   { bg: 'bg-red-50',       text: 'text-red-600',      darkBg: 'dark:bg-red-900/30',      darkText: 'dark:text-red-400' },
  '其他支出':   { bg: 'bg-gray-100',     text: 'text-gray-700',     darkBg: 'dark:bg-gray-800/50',     darkText: 'dark:text-gray-300' },
  '员工福利费': { bg: 'bg-pink-100',     text: 'text-pink-700',     darkBg: 'dark:bg-pink-900/40',     darkText: 'dark:text-pink-300' },
}

const FALLBACK = { bg: 'bg-gray-100', text: 'text-gray-600', darkBg: 'dark:bg-gray-800/40', darkText: 'dark:text-gray-400' }

/**
 * 获取分类的颜色class字符串
 * 返回: "bg-xxx text-xxx dark:bg-xxx dark:text-xxx"
 */
export function getCategoryColorClass(category: string): string {
  const c = CATEGORY_COLOR_MAP[category] || FALLBACK
  return `${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`
}
