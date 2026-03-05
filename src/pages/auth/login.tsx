import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { loginSchema, type LoginFormValues } from '@/lib/validators'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Wallet } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormValues) {
    try {
      await login(data)
      toast.success('登录成功')
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        <span className="font-display text-xl font-bold">智能记账</span>
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold tracking-tight">欢迎回来</h2>
        <p className="text-sm text-muted-foreground">
          输入您的账号信息登录系统
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>手机号</FormLabel>
                <FormControl>
                  <Input placeholder="请输入手机号" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>密码</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="请输入密码" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '登录中...' : '登录'}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        还没有账号？{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          立即注册
        </Link>
      </p>
    </div>
  )
}
