import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, FileText, ArrowRight, AlertTriangle, CheckCircle2, Clock, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth.store'
import { taxService } from '@/services/tax.service'
import type { TaxReminder } from '@/types/tax'

export default function TaxPage() {
  const user = useAuthStore((s) => s.user)
  const [reminders, setReminders] = useState<TaxReminder[]>([])

  useEffect(() => {
    async function loadReminders() {
      if (user?.businessType) {
        const data = await taxService.getReminders(user.businessType)
        setReminders(data)
      }
    }
    loadReminders()
  }, [user?.businessType])

  const statusIcon = {
    upcoming: <Clock className="h-4 w-4 text-muted-foreground" />,
    urgent: <AlertTriangle className="h-4 w-4 text-warning" />,
    overdue: <AlertTriangle className="h-4 w-4 text-destructive" />,
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="font-display text-2xl font-bold text-rich">智能税务</h1>
          <p className="mt-1 text-sm text-muted-foreground">申报提醒、智能生成报表、报税指引</p>
        </div>
        <div className="action-bar">
          <a href="https://etax.chinatax.gov.cn" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> 国家税务平台</Button>
          </a>
          <Link to="/tax/calendar">
            <Button variant="ghost" size="sm"><Calendar className="mr-1 h-4 w-4" /> 申报日历</Button>
          </Link>
          <Link to="/tax/declaration">
            <Button size="sm" className="rounded-lg"><FileText className="mr-1 h-4 w-4" /> 生成申报表</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reminders.map((reminder) => (
          <Card key={reminder.id} className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{reminder.periodLabel}</CardTitle>
                {statusIcon[reminder.status]}
              </div>
              <CardDescription>截止日期：{reminder.dueDate}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant={reminder.status === 'overdue' ? 'destructive' : reminder.status === 'urgent' ? 'default' : 'secondary'}>
                  {reminder.status === 'overdue' ? '已逾期' : reminder.status === 'urgent' ? `紧急 ${reminder.daysRemaining}天` : `${reminder.daysRemaining}天后`}
                </Badge>
                <Link to="/tax/declaration">
                  <Button variant="ghost" size="sm" className="text-xs">
                    去申报 <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reminders.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="flex h-40 items-center justify-center p-6">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-income" />
              <p className="mt-2 text-sm text-muted-foreground">当前没有待处理的申报任务</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 国家税务平台快捷入口 */}
      <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-accent/3 ink-wash gold-frame">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-rich">
            <ExternalLink className="h-4 w-4 text-primary" /> 国家税务平台快捷入口
          </CardTitle>
          <CardDescription>一键跳转国家税务总局电子税务局，使用本系统生成的数据快速完成申报</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: '电子税务局(自然人)',
                url: 'https://etax.chinatax.gov.cn',
                desc: '个人所得税申报、查询',
              },
              {
                label: '电子税务局(企业)',
                url: 'https://etax.chinatax.gov.cn',
                desc: '增值税、企业所得税申报',
              },
              {
                label: '个人所得税APP',
                url: 'https://etax.chinatax.gov.cn/webstatic/szds-app/views/download/index.html',
                desc: '下载官方APP随时申报',
              },
              {
                label: '税务政策查询',
                url: 'https://www.chinatax.gov.cn/chinatax/n810341/index.html',
                desc: '查看最新税收政策法规',
              },
            ].map((item) => (
              <a
                key={item.label}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1.5 rounded-xl border border-border/50 bg-card/80 p-4 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                </div>
                <span className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 报税步骤指引 */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-base"><span className="section-label">报税步骤指引</span></CardTitle>
          <CardDescription>个体工商户 / 小规模纳税人申报流程</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { step: 1, title: '登录国家税务平台', desc: '访问 etax.chinatax.gov.cn，使用自然人登录(个人所得税)或企业登录(增值税)进入电子税务局', action: { label: '打开税务平台', url: 'https://etax.chinatax.gov.cn' } },
              { step: 2, title: '选择申报税种', desc: '在电子税务局首页点击「我要办税」→「税费申报及缴纳」，根据申报周期选择增值税或个人所得税申报' },
              { step: 3, title: '导入申报数据', desc: '使用本系统「生成申报表」功能导出Excel，将销售额、成本、应纳税额等数据填写到税务平台对应栏位', action: { label: '生成申报表', url: '/tax/declaration', internal: true } },
              { step: 4, title: '提交并缴税', desc: '核对无误后提交申报表，系统将自动计算税款，支持银行卡、三方协议等多种缴款方式' },
            ].map((item) => (
              <div key={item.step} className="list-item-refined flex items-start gap-3 rounded-lg border border-border/30 p-3">
                <div className="icon-vessel h-7 w-7 shrink-0 bg-primary/10 text-xs font-bold text-primary rounded-lg">
                  {item.step}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  {'action' in item && item.action && (
                    item.action.internal ? (
                      <Link to={item.action.url} className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        {item.action.label} <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <a href={item.action.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        {item.action.label} <ExternalLink className="h-3 w-3" />
                      </a>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">关于自动对接税务平台：</strong>国家税务总局电子税务局不提供开放 API 接口，
              且税务系统使用多重安全认证(人脸识别/短信验证/数字证书)保护纳税人数据安全。
              因此无法实现完全自动化的数据报送。建议流程：在本系统生成申报数据 → 导出 Excel → 登录税务平台手动录入或导入。
              如需第三方报税服务，可考虑接入如「税友」「航天信息」等已获得税务局授权的服务商 API。
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
