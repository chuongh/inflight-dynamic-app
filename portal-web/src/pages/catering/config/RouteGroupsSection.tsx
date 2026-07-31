import { Button, Input, Select, Tag } from 'antd'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAirports } from '@/modules/airports/hooks/useAirports'
import type { SupplierRouteGroup } from '@/modules/catering/supplier/ecoQuantityTypes'

interface RouteGroupsSectionProps {
  routeGroups: SupplierRouteGroup[]
  editing: boolean
  onUpdate: (id: string, patch: Partial<SupplierRouteGroup>) => void
  onRemove: (id: string) => void
  onAdd: () => void
}

export function RouteGroupsSection({
  routeGroups,
  editing,
  onUpdate,
  onRemove,
  onAdd,
}: RouteGroupsSectionProps) {
  const { t } = useTranslation()
  const { data: airports = [] } = useAirports()

  const airportOptions = useMemo(
    () =>
      [...airports]
        .filter((a) => a.status !== 'inactive')
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((a) => ({
          value: a.code,
          label: `${a.code} — ${a.name}`,
        })),
    [airports],
  )

  return (
    <section className="config-section-surface">
      <h3 className="config-section-title">{t('catering.config.supplier.routeGroupsTitle')}</h3>
      <p className="config-section-desc">{t('catering.config.supplier.routeGroupsDesc')}</p>
      <p className="text-text-muted mb-3 text-[12px]">
        {t('catering.config.supplier.routeGroupsAirportMasterHint')}
      </p>

      <div className="flex flex-col gap-3">
        {routeGroups.map((group) =>
          editing ? (
            <div
              key={group.id}
              className="border-border flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-start"
            >
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-[12px] font-bold">
                  {t('catering.config.supplier.routeGroupLabel')}
                  <Input
                    value={group.label}
                    onChange={(e) => onUpdate(group.id, { label: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-[12px] font-bold">
                  {t('catering.config.supplier.routeGroupAirports')}
                  <Select
                    mode="multiple"
                    className="w-full"
                    showSearch
                    optionFilterProp="label"
                    value={group.airports}
                    options={airportOptions}
                    onChange={(codes) =>
                      onUpdate(group.id, {
                        airports: codes.map((a) => String(a).toUpperCase()),
                      })
                    }
                    placeholder={t('catering.config.supplier.routeGroupAirportsPlaceholder')}
                    notFoundContent={t('catering.config.supplier.routeGroupAirportsEmpty')}
                  />
                </label>
              </div>
              <Button
                type="text"
                danger
                size="small"
                className="sm:mt-6"
                icon={<Trash2 size={14} />}
                aria-label={t('catering.config.supplier.removeRouteGroup')}
                onClick={() => onRemove(group.id)}
              />
            </div>
          ) : (
            <div key={group.id} className="flex flex-wrap items-center gap-2">
              <span className="min-w-16 text-[13px] font-semibold">{group.label}</span>
              <span className="text-text-muted text-[11px] font-mono">{group.id}</span>
              {group.airports.map((a) => (
                <Tag key={a}>{a}</Tag>
              ))}
            </div>
          ),
        )}
        {editing ? (
          <Button type="dashed" icon={<Plus size={15} />} onClick={onAdd}>
            {t('catering.config.supplier.addRouteGroup')}
          </Button>
        ) : null}
      </div>
    </section>
  )
}
