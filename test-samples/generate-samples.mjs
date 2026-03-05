/**
 * 生成对账中心测试用的银行流水Excel样本文件
 * 运行方式: node test-samples/generate-samples.mjs
 */
import XLSX from 'xlsx'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ============================================================
// 样本1: 标准银行流水格式（与系统记账记录部分匹配）
// ============================================================
const bankStatement = [
  { 交易日期: '2026-03-03', 交易金额: 3200.00, 收支: '收入', 交易摘要: '微信收款-印花T恤', 对方户名: '张三' },
  { 交易日期: '2026-03-03', 交易金额: 1800.00, 收支: '收入', 交易摘要: '支付宝收款-牛仔裤', 对方户名: '李四' },
  { 交易日期: '2026-03-03', 交易金额: 280.00,  收支: '支出', 交易摘要: '快递费-顺丰', 对方户名: '顺丰速运' },
  { 交易日期: '2026-03-02', 交易金额: 4500.00, 收支: '收入', 交易摘要: '团购订单结算', 对方户名: '美团' },
  { 交易日期: '2026-03-02', 交易金额: 1200.00, 收支: '支出', 交易摘要: '采购运动鞋', 对方户名: '广州鞋厂' },
  { 交易日期: '2026-03-02', 交易金额: 350.00,  收支: '支出', 交易摘要: '外卖团建餐费', 对方户名: '饿了么' },
  // 以下2条故意不匹配（模拟漏记的交易）
  { 交易日期: '2026-03-01', 交易金额: 560.00,  收支: '收入', 交易摘要: '零售收款', 对方户名: '散客' },
  { 交易日期: '2026-02-28', 交易金额: 199.00,  收支: '支出', 交易摘要: '办公耗材采购', 对方户名: '得力文具' },
]

const ws1 = XLSX.utils.json_to_sheet(bankStatement)
ws1['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 24 }, { wch: 16 }]
const wb1 = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb1, ws1, '银行流水')
XLSX.writeFile(wb1, join(__dirname, '银行流水-标准格式.xlsx'))
console.log('✅ 已生成: 银行流水-标准格式.xlsx')

// ============================================================
// 样本2: 简化格式（不同列名，测试列名兼容性）
// ============================================================
const simpleStatement = [
  { 日期: '2026-03-03', 金额: 3200, 类型: '收入', 描述: '服装销售' },
  { 日期: '2026-03-03', 金额: -280, 类型: '支出', 描述: '快递费' },
  { 日期: '2026-03-02', 金额: 4500, 类型: '收入', 描述: '团购结算' },
  { 日期: '2026-03-02', 金额: -1200, 类型: '支出', 描述: '进货' },
  { 日期: '2026-03-01', 金额: 2600, 类型: '收入', 描述: '门店销售' },
  { 日期: '2026-03-01', 金额: -5000, 类型: '支出', 描述: '房租' },
]

const ws2 = XLSX.utils.json_to_sheet(simpleStatement)
ws2['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 20 }]
const wb2 = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb2, ws2, '流水')
XLSX.writeFile(wb2, join(__dirname, '银行流水-简化格式.xlsx'))
console.log('✅ 已生成: 银行流水-简化格式.xlsx')

// ============================================================
// 样本3: 英文列名格式（测试英文兼容性）
// ============================================================
const englishStatement = [
  { Date: '2026-03-03', Amount: 3200, type: 'income', Description: 'T-shirt sales' },
  { Date: '2026-03-03', Amount: -280, type: 'expense', Description: 'Shipping fee' },
  { Date: '2026-03-02', Amount: 4500, type: 'income', Description: 'Group buy settlement' },
]

const ws3 = XLSX.utils.json_to_sheet(englishStatement)
ws3['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 24 }]
const wb3 = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb3, ws3, 'Statement')
XLSX.writeFile(wb3, join(__dirname, '银行流水-英文格式.xlsx'))
console.log('✅ 已生成: 银行流水-英文格式.xlsx')

console.log('\n📁 所有样本文件已生成到 test-samples/ 目录')
console.log('📌 使用方法: 在对账中心点击"Excel文件上传"选择以上xlsx文件测试')
