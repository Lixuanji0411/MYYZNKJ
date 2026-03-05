import { z } from 'zod'

export const loginSchema = z.object({
  phone: z
    .string()
    .min(1, '请输入手机号')
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  password: z.string().min(6, '密码至少6位'),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, '姓名至少2个字符'),
    phone: z
      .string()
      .min(1, '请输入手机号')
      .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
    password: z
      .string()
      .min(6, '密码至少6位')
      .max(20, '密码最多20位'),
    confirmPassword: z.string().min(1, '请确认密码'),
    businessType: z.enum(['individual', 'small_taxpayer'], {
      message: '请选择企业类型',
    }),
    businessName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

export const accountingRecordSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('金额必须大于0'),
  category: z.string().min(1, '请选择分类'),
  description: z.string().min(1, '请输入描述'),
  date: z.string().min(1, '请选择日期'),
  tags: z.array(z.string()).optional(),
})

export const productSchema = z.object({
  name: z.string().min(1, '请输入商品名称'),
  unit: z.string().min(1, '请输入单位'),
  unitPrice: z.number().min(0, '售价不能为负'),
  costPrice: z.number().min(0, '成本价不能为负'),
  currentStock: z.number().int().min(0, '库存不能为负'),
  minStockAlert: z.number().int().min(0, '预警值不能为负'),
  category: z.string().optional(),
  description: z.string().optional(),
})

export const stockMovementSchema = z.object({
  productId: z.string().min(1, '请选择商品'),
  type: z.enum(['in', 'out']),
  quantity: z.number().int().positive('数量必须大于0'),
  unitPrice: z.number().min(0, '单价不能为负'),
  note: z.string().optional(),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type AccountingRecordFormValues = z.infer<typeof accountingRecordSchema>
export type ProductFormValues = z.infer<typeof productSchema>
export type StockMovementFormValues = z.infer<typeof stockMovementSchema>
