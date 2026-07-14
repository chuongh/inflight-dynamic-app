import { Alert, Modal } from 'antd'
import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDuration, groupFlightMinutes } from '@/modules/catering/grouping'
import type { FlightGroup } from '@/modules/catering/groupingTypes'

interface Props {
  open: boolean
  groups: FlightGroup[]
  station: string
  serviceDate: string
  onClose: () => void
  onSend: () => void
}

function shortPurser(name: string): string {
  return name.split(' ').slice(0, 3).join(' ')
}

export function OrderModal({ open, groups, station, serviceDate, onClose, onSend }: Props) {
  const { t } = useTranslation()
  const unconfirmed = groups.filter((g) => !g.confirmed).length

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div>
          <div className="text-[18px] font-extrabold">{t('catering.grouping.orderTitle')}</div>
          <div className="text-text-secondary text-[13px] font-semibold">
            {station} · {serviceDate} · {t('catering.grouping.orderSubtitle')}
          </div>
        </div>
      }
      okText={
        <span className="inline-flex items-center gap-2">
          <Send size={16} />
          {t('catering.grouping.sendSupplier')}
        </span>
      }
      cancelText={t('common.cancel')}
      onOk={onSend}
      width={560}
    >
      {unconfirmed > 0 ? (
        <Alert
          className="mb-3.5"
          type="warning"
          showIcon
          title={t('catering.grouping.orderUnconfirmedWarn', { count: unconfirmed })}
        />
      ) : null}

      <p className="text-text-secondary mb-3 text-[12.5px] font-semibold">
        {t('catering.grouping.orderNote')}
      </p>

      <div className="flex flex-col gap-2">
        {groups.map((g, i) => (
          <div
            key={g.id}
            className="border-border flex items-center justify-between rounded-lg border px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="bg-[#F1F5F9] text-foreground grid h-7 w-7 shrink-0 place-items-center rounded-md text-[12px] font-extrabold">
                {i + 1}
              </span>
              <div className="text-[13px] font-bold">
                {g.aircraft} · {shortPurser(g.purser)}
                <span className="text-text-secondary mt-px block text-[11.5px] font-semibold">
                  {g.legs.map((l) => l.flightNo).join(' · ')}
                </span>
              </div>
            </div>
            <div className="text-vj-red-dark text-[13px] font-extrabold tnum">
              {t('catering.grouping.legsCount', { count: g.legs.length })} · {formatDuration(groupFlightMinutes(g))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-vj-red-50 mt-3 flex items-center justify-between rounded-lg px-3.5 py-3 font-extrabold">
        <span>{t('catering.grouping.orderTotalLabel')}</span>
        <span className="text-vj-red-dark text-[20px]">
          {t('catering.grouping.groupCount', { count: groups.length })}
        </span>
      </div>
    </Modal>
  )
}
