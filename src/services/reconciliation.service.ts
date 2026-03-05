import type { ReconciliationFlow } from '@/types/accounting'
import { LocalStorageService } from './base.service'
import { accountingService } from './accounting.service'

type ReconciliationFlowEntity = ReconciliationFlow & { updatedAt: string }

class ReconciliationService extends LocalStorageService<ReconciliationFlowEntity> {
  constructor() {
    super('reconciliation_flows')
  }

  async autoMatch(): Promise<{ matched: number; unmatchedFlows: number; unmatchedRecords: number }> {
    const flows = await this.getAll()
    const records = await accountingService.getAll()

    let matched = 0
    let unmatchedFlows = 0

    const matchedRecordIds = new Set<string>()

    for (const flow of flows) {
      if (flow.matchedRecordId) {
        matched++
        matchedRecordIds.add(flow.matchedRecordId)
        continue
      }

      const match = records.find((r) => {
        if (matchedRecordIds.has(r.id)) return false
        if (r.isReconciled) return false

        const amountMatch = Math.abs(r.amount - flow.amount) < 0.01
        const typeMatch = r.type === flow.type

        if (!amountMatch || !typeMatch) return false

        const recordDate = new Date(r.date)
        const flowDate = new Date(flow.date)
        const dayDiff = Math.abs(recordDate.getTime() - flowDate.getTime()) / (1000 * 60 * 60 * 24)
        return dayDiff <= 1
      })

      if (match) {
        await this.update(flow.id, {
          matchedRecordId: match.id,
          status: 'matched',
        })
        await accountingService.update(match.id, {
          isReconciled: true,
          reconciledFlowId: flow.id,
        })
        matchedRecordIds.add(match.id)
        matched++
      } else {
        await this.update(flow.id, { status: 'unmatched_flow' })
        unmatchedFlows++
      }
    }

    const unmatchedRecords = records.filter(
      (r) => !r.isReconciled && !matchedRecordIds.has(r.id)
    ).length

    return { matched, unmatchedFlows, unmatchedRecords }
  }

  async importFlows(flows: Array<Omit<ReconciliationFlow, 'id' | 'createdAt' | 'status' | 'matchedRecordId'>>): Promise<number> {
    let imported = 0
    for (const flow of flows) {
      await this.create({
        ...flow,
        status: 'unmatched_flow',
      } as Omit<ReconciliationFlowEntity, 'id' | 'createdAt' | 'updatedAt'>)
      imported++
    }
    return imported
  }
}

export const reconciliationService = new ReconciliationService()
