import { App as AntApp, Spin } from 'antd'
import { AlertTriangle, Clock, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CompleteRepairModal } from '@/components/equipment/CompleteRepairModal'
import {
  SendToRepairModal,
  type SendToRepairFormValues,
} from '@/components/equipment/SendToRepairModal'
import type { TrolleyUnit } from '@/modules/equipment/constants'
import {
  useCompleteRepairRequest,
  useRepairRequests,
  useSendTrolleysToRepair,
  useTrolleys,
} from '@/modules/equipment/hooks/useEquipment'
import { formatEquipmentCodes, summarizeRepairRequests } from '@/modules/equipment/repairRequest'
import type { CompleteRepairRequestInput, RepairRequest } from '@/modules/equipment/types'
import { KpiCard } from '@/components/patterns/KpiCard'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Button as VjButton } from '@/components/primitives/Button'
import { Text } from '@/components/primitives/Text'
import { useEquipmentLabels } from '@/i18n/hooks/useEquipmentLabels'

const DAY_MS = 86_400_000
const SLA_DAYS = 2

function issueOfTrolley(trolley: TrolleyUnit, fallback: string): string {
  const damagedCheckin = trolley.movements.find(
    (movement) => movement.type === 'checkin' && movement.condition === 'damaged',
  )
  return damagedCheckin?.note || trolley.lastRepairReason || fallback
}

function ageDays(fromTimestamp: number, now: number): number {
  return Math.max(0, Math.floor((now - fromTimestamp) / DAY_MS))
}

function AgeChip({ days, critical }: { days: number; critical: boolean }) {
  const { t } = useTranslation()
  return (
    <span
      className="tnum whitespace-nowrap text-[11px] font-bold"
      style={{ color: critical ? 'var(--color-vj-red)' : 'var(--color-text-secondary)' }}
    >
      {t('equipment.workshop.daysCount', { count: days })}
      {critical ? ` · ${t('equipment.workshop.slaCritical')}` : ''}
    </span>
  )
}

function ColumnHeader({ label, count, dotColor }: { label: string; count: number; dotColor: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: dotColor }} aria-hidden />
      <Text variant="h3">{label}</Text>
      <span className="tnum ml-auto text-sm font-extrabold text-[var(--color-text-secondary)]">{count}</span>
    </div>
  )
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-center text-xs font-bold text-[var(--color-text-muted)]">
      {label}
    </div>
  )
}

interface KanbanCardProps {
  code: string
  issue: string
  meta: string[]
  days: number
  critical: boolean
  actionLabel: string
  actionVariant: 'primary' | 'secondary'
  onAction: () => void
}

function KanbanCard({ code, issue, meta, days, critical, actionLabel, actionVariant, onAction }: KanbanCardProps) {
  return (
    <div
      className="rounded-lg border bg-[var(--color-surface)] p-3 shadow-[var(--shadow-soft)]"
      style={{
        borderColor: 'var(--color-border)',
        borderLeft: critical ? '3px solid var(--color-vj-red)' : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="tnum text-sm font-extrabold text-vj-red">{code}</span>
        <AgeChip days={days} critical={critical} />
      </div>
      <div className="mt-2 text-sm font-bold text-[var(--color-foreground)]">{issue}</div>
      <div className="mt-2 flex flex-wrap gap-2.5 text-[11.5px] font-semibold text-[var(--color-text-secondary)]">
        {meta.map((entry) => (
          <span key={entry}>{entry}</span>
        ))}
      </div>
      <VjButton variant={actionVariant} size="small" block className="mt-2.5" onClick={onAction}>
        {actionLabel}
      </VjButton>
    </div>
  )
}

export function RepairWorkshopPage() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const { typeLabel } = useEquipmentLabels()
  const now = Date.now()

  const { data: trolleys = [], isLoading: trolleysLoading } = useTrolleys()
  const { data: repairRequests = [], isLoading: requestsLoading } = useRepairRequests()
  const sendToRepair = useSendTrolleysToRepair()
  const completeRepair = useCompleteRepairRequest()

  const [sendTarget, setSendTarget] = useState<TrolleyUnit | null>(null)
  const [completeTarget, setCompleteTarget] = useState<RepairRequest | null>(null)

  const waitingTrolleys = useMemo(
    () => trolleys.filter((trolley) => trolley.status === 'not-service'),
    [trolleys],
  )

  const trolleyRequests = useMemo(
    () => repairRequests.filter((request) => request.equipmentType === 'trolley'),
    [repairRequests],
  )

  const openRequests = useMemo(
    () => trolleyRequests.filter((request) => request.status === 'open'),
    [trolleyRequests],
  )

  const summary = useMemo(() => summarizeRepairRequests(trolleyRequests), [trolleyRequests])

  const waitingSlaBreaches = waitingTrolleys.filter((trolley) => trolley.daysInStatus > SLA_DAYS).length

  const isLoading = trolleysLoading || requestsLoading

  const handleSendSubmit = (values: SendToRepairFormValues) => {
    if (!sendTarget) return
    const code = sendTarget.code
    sendToRepair.mutate(
      { codes: [code], vendor: values.vendor },
      {
        onSuccess: () => {
          message.success(t('equipment.workshop.sendSuccess', { code, vendor: values.vendor }))
          setSendTarget(null)
        },
        onError: () => {
          message.error(t('equipment.workshop.sendFailed'))
        },
      },
    )
  }

  const handleCompleteSubmit = (input: CompleteRepairRequestInput) => {
    if (!completeTarget) return
    const id = completeTarget.id
    const codeLabel = formatEquipmentCodes(completeTarget.equipmentCodes)
    completeRepair.mutate(
      { id, input },
      {
        onSuccess: () => {
          message.success(t('equipment.workshop.completeSuccess', { code: codeLabel }))
          setCompleteTarget(null)
        },
        onError: () => {
          message.error(t('equipment.workshop.completeFailed'))
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-shell page-shell--list">
      <div className="thin-scroll page-shell__body">
        <PageHeader
          badge={t('equipment.workshop.badge')}
          title={t('equipment.workshop.title')}
          description={t('equipment.workshop.subtitle')}
        />

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label={t('equipment.workshop.kpiWaiting')}
            value={waitingTrolleys.length}
            hint={t('equipment.workshop.kpiWaitingHint', { count: waitingSlaBreaches })}
            icon={AlertTriangle}
            tone="danger"
          />
          <KpiCard
            label={t('equipment.workshop.kpiInRepair')}
            value={openRequests.length}
            hint={t('equipment.workshop.kpiInRepairHint')}
            icon={Wrench}
            tone="warning"
          />
          <KpiCard
            label={t('equipment.workshop.kpiAvgTat')}
            value={
              summary.avgTurnaround > 0
                ? `${summary.avgTurnaround} ${t('equipment.workshop.kpiAvgTatUnit')}`
                : '—'
            }
            hint={t('equipment.workshop.kpiAvgTatHint')}
            icon={Clock}
            tone="brand"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-vj-canvas)] p-3">
            <ColumnHeader
              label={t('equipment.workshop.columnWaiting')}
              count={waitingTrolleys.length}
              dotColor="var(--color-vj-red)"
            />
            <div className="flex flex-col gap-2.5">
              {waitingTrolleys.length === 0 ? (
                <EmptyColumn label={t('equipment.workshop.empty')} />
              ) : (
                waitingTrolleys.map((trolley) => {
                  const days = trolley.daysInStatus
                  return (
                    <KanbanCard
                      key={trolley.code}
                      code={trolley.code}
                      issue={issueOfTrolley(trolley, t('equipment.workshop.issueFallback'))}
                      meta={[trolley.rfidEpc.split(' ').pop() ?? trolley.rfidEpc, trolley.station, typeLabel(trolley.type)]}
                      days={days}
                      critical={days > SLA_DAYS}
                      actionLabel={t('equipment.workshop.sendToVendor')}
                      actionVariant="primary"
                      onAction={() => setSendTarget(trolley)}
                    />
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-vj-canvas)] p-3">
            <ColumnHeader
              label={t('equipment.workshop.columnInRepair')}
              count={openRequests.length}
              dotColor="var(--color-vj-yellow)"
            />
            <div className="flex flex-col gap-2.5">
              {openRequests.length === 0 ? (
                <EmptyColumn label={t('equipment.workshop.empty')} />
              ) : (
                openRequests.map((request) => {
                  const days = ageDays(request.requestedAt, now)
                  return (
                    <KanbanCard
                      key={request.id}
                      code={formatEquipmentCodes(request.equipmentCodes)}
                      issue={request.issueDescription}
                      meta={[request.id, request.vendor]}
                      days={days}
                      critical={days > SLA_DAYS}
                      actionLabel={t('equipment.workshop.acceptRepair')}
                      actionVariant="secondary"
                      onAction={() => setCompleteTarget(request)}
                    />
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <SendToRepairModal
        open={sendTarget != null}
        unitCount={1}
        unitLabel={t('common.unit')}
        onCancel={() => setSendTarget(null)}
        onSubmit={handleSendSubmit}
      />

      <CompleteRepairModal
        open={completeTarget != null}
        request={completeTarget}
        onClose={() => setCompleteTarget(null)}
        onSubmit={handleCompleteSubmit}
      />
    </div>
  )
}
