import { Input, Modal, Tag } from 'antd'
import { Minus, Plus, Search, Table2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DEFAULT_AMENITY_PACKAGE_COMPOSITIONS,
  DEFAULT_AMENITY_PRODUCTS,
  DEFAULT_PERIODIC_TOPUP_ITEMS,
} from '@/modules/catering/supplier/amenityQuantityDefaults'
import type { AmenityPackageComposition } from '@/modules/catering/supplier/amenityQuantityTypes'
import type { EcoAmenityConfig } from '@/modules/catering/supplier/ecoQuantityTypes'

interface Props {
  amenityConfig: EcoAmenityConfig
  /** When true, package qty can be adjusted with steppers. */
  editing?: boolean
  /** Optional controlled compositions; falls back to defaults. */
  compositions?: AmenityPackageComposition[]
  onChangeQty?: (packageId: number, productCode: string, quantity: number) => void
}

function Stepper({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (next: number) => void
  disabled?: boolean
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={disabled || value <= 0}
        aria-label="−"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="border-border bg-background text-foreground enabled:hover:bg-muted grid h-8 w-8 place-items-center rounded-lg border text-[15px] font-bold disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <span className="tnum min-w-[2.25rem] text-center text-[14px] font-extrabold">{value}</span>
      <button
        type="button"
        disabled={disabled}
        aria-label="+"
        onClick={() => onChange(value + 1)}
        className="border-border bg-background text-foreground enabled:hover:bg-muted grid h-8 w-8 place-items-center rounded-lg border text-[15px] font-bold disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}

function productMetaLine(product: {
  code: string
  unit: string
  spec?: string | null
}): string {
  return [product.code, product.unit, product.spec].filter(Boolean).join(' · ')
}

export function AmenityCompositionSection({
  amenityConfig,
  editing = false,
  compositions: compositionsProp,
  onChangeQty,
}: Props) {
  const { t } = useTranslation()

  const packages = useMemo(
    () => [...amenityConfig.packages].sort((a, b) => a.id - b.id),
    [amenityConfig.packages],
  )

  const [selectedPkgId, setSelectedPkgId] = useState<number>(() => packages[0]?.id ?? 1)
  const [packageQuery, setPackageQuery] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [matrixOpen, setMatrixOpen] = useState(false)
  /** Local draft while editing when parent does not control compositions. */
  const [localCompositions, setLocalCompositions] = useState<AmenityPackageComposition[] | null>(
    null,
  )

  useEffect(() => {
    if (editing && compositionsProp == null && localCompositions == null) {
      setLocalCompositions(structuredClone(DEFAULT_AMENITY_PACKAGE_COMPOSITIONS))
    }
    if (!editing) setLocalCompositions(null)
  }, [editing, compositionsProp, localCompositions])

  const compositions =
    compositionsProp ?? localCompositions ?? DEFAULT_AMENITY_PACKAGE_COMPOSITIONS

  const qtyByPkgProduct = useMemo(() => {
    const map = new Map<string, number>()
    for (const composition of compositions) {
      for (const item of composition.items) {
        if (typeof item.quantity !== 'number') continue
        map.set(`${composition.packageId}|${item.productCode}`, item.quantity)
      }
    }
    return map
  }, [compositions])

  const productCountByPkg = useMemo(() => {
    const map = new Map<number, number>()
    for (const composition of compositions) {
      const count = composition.items.filter(
        (i) => typeof i.quantity === 'number' && i.quantity > 0,
      ).length
      map.set(composition.packageId, count)
    }
    return map
  }, [compositions])

  const productByCode = useMemo(
    () => new Map(DEFAULT_AMENITY_PRODUCTS.map((p) => [p.code, p])),
    [],
  )

  const packageLabel = (id: number) =>
    amenityConfig.packages.find((p) => p.id === id)?.label ?? `#${id}`

  const filteredPackages = useMemo(() => {
    const q = packageQuery.trim().toLowerCase()
    if (!q) return packages
    return packages.filter(
      (p) => String(p.id).includes(q) || p.label.toLowerCase().includes(q),
    )
  }, [packages, packageQuery])

  const visibleProducts = useMemo(() => {
    return DEFAULT_AMENITY_PRODUCTS.filter((product) => {
      const qty = qtyByPkgProduct.get(`${selectedPkgId}|${product.code}`)
      return qty != null && qty > 0
    })
  }, [selectedPkgId, qtyByPkgProduct])

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    if (!q) return visibleProducts
    return visibleProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.spec?.toLowerCase().includes(q) ?? false),
    )
  }, [visibleProducts, productQuery])

  const packageIds = packages.map((p) => p.id)

  const setQty = (packageId: number, productCode: string, quantity: number) => {
    const next = Math.max(0, Math.round(quantity))
    if (onChangeQty) {
      onChangeQty(packageId, productCode, next)
      return
    }
    setLocalCompositions((prev) => {
      const base = structuredClone(prev ?? DEFAULT_AMENITY_PACKAGE_COMPOSITIONS)
      const composition = base.find((c) => c.packageId === packageId)
      if (!composition) return prev
      const item = composition.items.find((i) => i.productCode === productCode)
      if (item) {
        item.quantity = next
      } else {
        composition.items.push({ productCode, quantity: next })
      }
      return base
    })
  }

  const selectPackage = (id: number) => {
    setSelectedPkgId(id)
    setProductQuery('')
  }

  const matrixTable = (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-[12.5px]">
        <thead>
          <tr className="text-text-secondary [&>th]:border-border [&>th]:border-b [&>th]:px-2 [&>th]:py-2 [&>th]:text-left [&>th]:text-[10.5px] [&>th]:font-extrabold [&>th]:uppercase">
            <th>{t('catering.config.supplier.compositionCode')}</th>
            <th>{t('catering.config.supplier.compositionName')}</th>
            <th>{t('catering.config.supplier.compositionUnit')}</th>
            <th>{t('catering.config.supplier.compositionSpec')}</th>
            {packageIds.map((id) => (
              <th key={id} className="text-center!" title={packageLabel(id)}>
                {id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DEFAULT_AMENITY_PRODUCTS.map((product) => (
            <tr
              key={product.code}
              className="[&>td]:border-border [&>td]:border-b [&>td]:px-2 [&>td]:py-1.5"
            >
              <td className="font-mono text-[11.5px] font-semibold">{product.code}</td>
              <td>{product.name}</td>
              <td className="text-text-muted">{product.unit}</td>
              <td className="text-text-muted">{product.spec ?? '—'}</td>
              {packageIds.map((id) => {
                const qty = qtyByPkgProduct.get(`${id}|${product.code}`)
                return (
                  <td key={id} className="tnum text-center font-semibold">
                    {qty == null ? <span className="text-text-muted">·</span> : qty}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-text-muted mb-0 text-[12.5px]">
        {t('catering.config.supplier.compositionDesc')}
      </p>

      <div className="border-border grid grid-cols-1 overflow-hidden rounded-xl border sm:grid-cols-[220px_1fr]">
        {/* Left: package list */}
        <div className="border-border flex max-h-[min(70vh,640px)] flex-col border-b sm:border-r sm:border-b-0">
          <div className="border-border shrink-0 border-b p-2.5">
            <Input
              allowClear
              size="small"
              value={packageQuery}
              onChange={(e) => setPackageQuery(e.target.value)}
              prefix={<Search size={14} className="text-text-muted" />}
              placeholder={t('catering.config.supplier.compositionPackageSearchPlaceholder')}
            />
          </div>
          <div className="flex gap-1 overflow-x-auto p-1.5 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto">
            {filteredPackages.map((pkg) => {
              const selected = pkg.id === selectedPkgId
              const count = productCountByPkg.get(pkg.id) ?? 0
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => selectPackage(pkg.id)}
                  className={[
                    'flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors',
                    'sm:w-full',
                    selected
                      ? 'bg-planner-accent-soft text-planner-accent font-semibold'
                      : 'text-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  <span className="min-w-0 flex-1 truncate">
                    <span className="tnum font-bold">{pkg.id}</span>
                    <span className="text-text-muted mx-1">·</span>
                    {pkg.label}
                  </span>
                  <span
                    className={[
                      'tnum shrink-0 text-[11px] font-bold',
                      selected ? 'opacity-80' : 'text-text-muted',
                    ].join(' ')}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
            {filteredPackages.length === 0 ? (
              <p className="text-text-muted px-2 py-4 text-center text-[12px]">—</p>
            ) : null}
          </div>
        </div>

        {/* Right: product cards */}
        <div className="flex max-h-[min(70vh,640px)] min-w-0 flex-col">
          <div className="border-border flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2.5">
            <div className="min-w-0">
              <h4 className="m-0 text-[13px] font-bold">
                {t('catering.config.supplier.compositionSelectedPackage', {
                  id: selectedPkgId,
                  label: packageLabel(selectedPkgId),
                })}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setMatrixOpen(true)}
              className="text-text-muted hover:text-foreground inline-flex shrink-0 items-center gap-1.5 text-[11.5px] font-semibold"
            >
              <Table2 size={13} />
              {t('catering.config.supplier.compositionAllPackagesView', {
                n: packages.length,
              })}
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3.5">
            <Input
              allowClear
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              prefix={<Search size={15} className="text-text-muted" />}
              placeholder={t('catering.config.supplier.compositionSearchPlaceholder')}
              className="max-w-md"
            />

            <div className="flex flex-col gap-2">
              {filteredProducts.map((product) => {
                const qty = qtyByPkgProduct.get(`${selectedPkgId}|${product.code}`) ?? 0
                return (
                  <div
                    key={product.code}
                    className="border-border bg-surface flex w-full min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] font-semibold">{product.name}</div>
                      <p className="text-text-muted mt-0.5 mb-0 text-[12px] leading-snug">
                        {productMetaLine(product)}
                      </p>
                    </div>
                    {editing ? (
                      <Stepper
                        value={qty}
                        onChange={(next) => setQty(selectedPkgId, product.code, next)}
                      />
                    ) : (
                      <span className="tnum shrink-0 text-[15px] font-extrabold">{qty}</span>
                    )}
                  </div>
                )
              })}
              {filteredProducts.length === 0 ? (
                <p className="text-text-muted py-6 text-center text-[12.5px]">—</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={matrixOpen}
        onCancel={() => setMatrixOpen(false)}
        footer={null}
        width="90vw"
        style={{ maxWidth: 1100 }}
        title={t('catering.config.supplier.compositionAllPackagesView', {
          n: packages.length,
        })}
        destroyOnHidden
      >
        {matrixTable}
      </Modal>

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
                {product?.spec ? (
                  <span className="text-text-muted">{product.spec}</span>
                ) : null}
                <span className="text-text-muted">{item.cadenceNote}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
