import { Select, Tag } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DEFAULT_AMENITY_PACKAGE_COMPOSITIONS,
  DEFAULT_AMENITY_PRODUCTS,
  DEFAULT_PERIODIC_TOPUP_ITEMS,
} from '@/modules/catering/supplier/amenityQuantityDefaults'
import type { EcoAmenityConfig } from '@/modules/catering/supplier/ecoQuantityTypes'

interface Props {
  amenityConfig: EcoAmenityConfig
}

const ALL = 'all'

export function AmenityCompositionSection({ amenityConfig }: Props) {
  const { t } = useTranslation()

  const packageIds = useMemo(
    () =>
      [...new Set(DEFAULT_AMENITY_PACKAGE_COMPOSITIONS.map((c) => c.packageId))].sort(
        (a, b) => a - b,
      ),
    [],
  )

  const [pkgFilter, setPkgFilter] = useState<string>(() =>
    String(packageIds[0] ?? ALL),
  )

  const qtyByPkgProduct = useMemo(() => {
    const map = new Map<string, number>()
    for (const composition of DEFAULT_AMENITY_PACKAGE_COMPOSITIONS) {
      for (const item of composition.items) {
        if (typeof item.quantity !== 'number') continue
        map.set(`${composition.packageId}|${item.productCode}`, item.quantity)
      }
    }
    return map
  }, [])

  const productByCode = useMemo(
    () => new Map(DEFAULT_AMENITY_PRODUCTS.map((p) => [p.code, p])),
    [],
  )

  const packageLabel = (id: number) =>
    amenityConfig.packages.find((p) => p.id === id)?.label ?? `#${id}`

  const selectedPkgId = pkgFilter === ALL ? null : Number(pkgFilter)
  const visiblePackageIds = selectedPkgId == null ? packageIds : [selectedPkgId]

  const visibleProducts = useMemo(() => {
    if (selectedPkgId == null) return DEFAULT_AMENITY_PRODUCTS
    return DEFAULT_AMENITY_PRODUCTS.filter((product) => {
      const qty = qtyByPkgProduct.get(`${selectedPkgId}|${product.code}`)
      return qty != null && qty > 0
    })
  }, [selectedPkgId, qtyByPkgProduct])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[220px] flex-col gap-1 text-[12px] font-bold">
          {t('catering.config.supplier.compositionFilter')}
          <Select
            className="w-full min-w-[220px]"
            value={pkgFilter}
            onChange={setPkgFilter}
            options={[
              { value: ALL, label: t('catering.config.supplier.compositionAllPackages') },
              ...packageIds.map((id) => ({
                value: String(id),
                label: `${id} · ${packageLabel(id)}`,
              })),
            ]}
          />
        </label>
        <p className="text-text-muted mb-1.5 text-[12.5px]">
          {t('catering.config.supplier.compositionDesc')}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table
          className={`w-full text-[12.5px] ${selectedPkgId == null ? 'min-w-[720px]' : 'min-w-[420px]'}`}
        >
          <thead>
            <tr className="text-text-secondary [&>th]:border-border [&>th]:border-b [&>th]:px-2 [&>th]:py-2 [&>th]:text-left [&>th]:text-[10.5px] [&>th]:font-extrabold [&>th]:uppercase">
              <th>{t('catering.config.supplier.compositionCode')}</th>
              <th>{t('catering.config.supplier.compositionName')}</th>
              <th>{t('catering.config.supplier.compositionUnit')}</th>
              {visiblePackageIds.map((id) => (
                <th key={id} className="text-center!" title={packageLabel(id)}>
                  {selectedPkgId == null ? id : t('catering.config.supplier.compositionQty')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((product) => (
              <tr
                key={product.code}
                className="[&>td]:border-border [&>td]:border-b [&>td]:px-2 [&>td]:py-1.5"
              >
                <td className="font-mono text-[11.5px] font-semibold">{product.code}</td>
                <td>{product.name}</td>
                <td className="text-text-muted">{product.unit}</td>
                {visiblePackageIds.map((id) => {
                  const qty = qtyByPkgProduct.get(`${id}|${product.code}`)
                  return (
                    <td key={id} className="tnum text-center font-semibold">
                      {qty == null ? <span className="text-text-muted">·</span> : qty}
                    </td>
                  )
                })}
              </tr>
            ))}
            {visibleProducts.length === 0 ? (
              <tr>
                <td colSpan={3 + visiblePackageIds.length} className="text-text-muted px-2 py-4 text-center">
                  —
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="mb-1 text-[13px] font-bold">
          {t('catering.config.supplier.periodicTitle')}
        </h4>
        <p className="text-text-muted mb-2 text-[12px]">
          {t('catering.config.supplier.periodicDesc')}
        </p>
        <div className="flex flex-col gap-2">
          {DEFAULT_PERIODIC_TOPUP_ITEMS.map((item) => {
            const product = productByCode.get(item.productCode)
            return (
              <div
                key={`${item.productCode}-${item.cadenceNote}`}
                className="flex flex-wrap items-baseline gap-2 text-[12.5px]"
              >
                <Tag className="font-mono">{item.productCode}</Tag>
                <span className="font-semibold">{product?.name ?? item.productCode}</span>
                <span className="text-text-muted">{item.cadenceNote}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
