import { useState } from 'react'
import { Alert, Button as AntButton, Dropdown, Input, Modal, Select, Table, Tabs, Tag, Tooltip } from 'antd'
import { AlertTriangle, CheckCircle2, Info, MoreHorizontal, ShoppingCart, Wrench } from 'lucide-react'
import { MobileDesignPreview } from '@/components/patterns/MobileDesignPreview'
import { DataTableShell } from '@/components/patterns/DataTableShell'
import { KpiCard } from '@/components/patterns/KpiCard'
import { PageHeader } from '@/components/patterns/PageHeader'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import { VietJetLogo } from '@/components/brand/VietJetLogo'
import { DetailHero } from '@/components/patterns/DetailHero'
import { FilterBar } from '@/components/patterns/FilterBar'
import { EquipmentBadge, RepairRequestBadge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { DaysBadge } from '@/components/primitives/DaysBadge'
import { Text } from '@/components/primitives/Text'
import { vjColorPalette, vjGradientPalette, vjTokens, type EquipmentStatusKey, type RepairRequestStatusKey } from '@/design-system'

const DS_TABLE_ROWS = [
  { key: '1', code: 'VJ-TC-0042', station: 'SGN', status: 'service' as const, days: 3 },
  { key: '2', code: 'VJ-TC-0118', station: 'HAN', status: 'repairing' as const, days: 9 },
  { key: '3', code: 'VJ-TC-0201', station: 'DAD', status: 'not-service' as const, days: 16 },
]

function DsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="ds-section">
      <div className="ds-section__header">
        <h2 className="ds-section__title">{title}</h2>
        {description ? <p className="ds-section__desc">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

function GradientSwatch({
  name,
  token,
  css,
  role,
}: {
  name: string
  token: string
  css: string
  role?: string
}) {
  return (
    <div className="ds-gradient-swatch">
      <div className="ds-gradient-swatch__preview" style={{ background: css }} />
      <div className="ds-swatch__meta">
        <span className="ds-swatch__name">{name}</span>
        {role ? <span className="text-[11px] text-[var(--color-text-secondary)]">{role}</span> : null}
        <span className="ds-swatch__token">{token}</span>
      </div>
    </div>
  )
}

function ColorSwatch({
  name,
  hex,
  token,
  pantone,
}: {
  name: string
  hex: string
  token: string
  pantone?: string
}) {
  const isLight = ['#FFFFFF', '#F8FAFC', '#FEEAE9', '#EDF9E0', '#FFF4C4', '#E8ECF1', '#FAFAFA'].includes(hex)
  return (
    <div className="ds-swatch">
      <div
        className="ds-swatch__color"
        style={{
          background: hex,
          border: isLight ? '1px solid #E5E5E5' : 'none',
        }}
      />
      <div className="ds-swatch__meta">
        <span className="ds-swatch__name">{name}</span>
        <span className="ds-swatch__hex">{hex}</span>
        {pantone ? <span className="ds-swatch__token">Pantone {pantone}</span> : null}
        <span className="ds-swatch__token">{token}</span>
      </div>
    </div>
  )
}

function TypeSample({
  label,
  sample,
  spec,
}: {
  label: string
  sample: React.ReactNode
  spec: string
}) {
  return (
    <div className="ds-type-row">
      <div className="ds-type-row__label">{label}</div>
      <div className="ds-type-row__sample">{sample}</div>
      <div className="ds-type-row__spec">{spec}</div>
    </div>
  )
}

export function DesignSystemPage() {
  const t = vjTokens.typography
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="page-shell page-shell--list">
      <div className="thin-scroll page-shell__body">
        <PageHeader
          badge="VJA Official"
          title="Design System"
          description="VietJet Air brand system — web, mobile, and all digital products"
        />

        <DsSection
          title="Mobile preview"
          description="Ops / crew Soft UI — task list, equipment status, repair queue · gradient header · light tab bar."
        >
          <MobileDesignPreview />
        </DsSection>

        <DsSection
          title="Data table (web)"
          description="DataTableShell + .data-table-wrap — sticky header, zebra, hover primaryMuted, selected inset red bar, overflow-x."
        >
          <DataTableShell>
            <Table
              size="middle"
              pagination={{ pageSize: 5, showTotal: (total) => `${total} items` }}
              rowSelection={{ type: 'radio', selectedRowKeys: ['1'] }}
              columns={[
                {
                  title: 'Code',
                  dataIndex: 'code',
                  render: (code: string) => <span className="table-cell-code">{code}</span>,
                },
                { title: 'Station', dataIndex: 'station' },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (status: EquipmentStatusKey) => <EquipmentBadge status={status} />,
                },
                {
                  title: 'Days',
                  dataIndex: 'days',
                  render: (days: number) => <DaysBadge days={days} />,
                },
              ]}
              dataSource={DS_TABLE_ROWS}
            />
          </DataTableShell>
          <ul className="mt-3 grid gap-1 text-sm text-[var(--color-text-secondary)] sm:grid-cols-2">
            <li>Sticky thead · uppercase 11px secondary</li>
            <li>Zebra: surface / background (#F8FAFC)</li>
            <li>Hover & selected: <code>#FEEAE9</code> · inset 3px <code>#F02823</code></li>
            <li>Pagination active: red border + muted fill</li>
          </ul>
        </DsSection>

        <DsSection title="Logo" description="Wordmark SVG — src/assets/vj-logo.svg (Đỏ VJA #F02823)">
          <div className="ds-brand-row flex-wrap items-center gap-8">
            <VietJetLogo size="sm" />
            <VietJetLogo size="md" />
            <VietJetLogo size="lg" />
          </div>
        </DsSection>

        <DsSection title="Màu UI (Ops Portal)" description="Palette thực tế dùng trong admin.">
          <div className="ds-swatch-grid">
            {vjColorPalette.map((c) => (
              <ColorSwatch
                key={c.token}
                name={c.name}
                hex={c.hex}
                token={`color.${c.token}`}
              />
            ))}
          </div>
        </DsSection>

        <DsSection
          title="Gradient & stripe"
          description="hero = login; bar = 4px stripe; soft = canvas wash; sidebar = admin shell / mobile header chrome."
        >
          <div className="ds-gradient-grid">
            {vjGradientPalette.map((g) => (
              <GradientSwatch
                key={g.token}
                name={g.name}
                token={g.token}
                css={g.css}
                role={'role' in g ? g.role : undefined}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div>
              <p className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">Brand stripe (gradient.bar)</p>
              <div className="vj-gradient-bar w-56" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold vj-gradient-text">Logo red</span>
              <span className="text-lg font-bold vj-accent-text">+ accent</span>
            </div>
            <AntButton type="primary">Primary button</AntButton>
          </div>
        </DsSection>

        <DsSection title="Kiểu chữ thương hiệu" description="JambonoVN (heading) + Plus Jakarta Sans (body).">
          <SurfaceCard padding="none">
            <TypeSample
              label="Tiêu đề"
              sample={
                <span className="font-vja-heading text-2xl uppercase">
                  Tất cả vì sự hài lòng của khách hàng
                </span>
              }
              spec="JambonoVN Black · fallback Nunito 900"
            />
            <TypeSample
              label="Subhead"
              sample={<span className="font-vja-subhead text-lg">Bay là Thích ngay!</span>}
              spec="JambonoVN Medium · fallback Nunito 500"
            />
            <TypeSample
              label="Body"
              sample={
                <span style={{ fontFamily: vjTokens.font.body, fontSize: t.body.size, lineHeight: t.body.lineHeight }}>
                  Overview of trolley carts across stations and repair workflows.
                </span>
              }
              spec="Plus Jakarta Sans Regular 14px"
            />
            <TypeSample
              label="H1 UI"
              sample={<span className="font-vja-heading text-2xl">Trolley list</span>}
              spec={`${t.h1.size}px / heading`}
            />
            <TypeSample
              label="Mono"
              sample={
                <span style={{ fontFamily: vjTokens.font.mono, fontSize: t.mono.size, fontWeight: t.mono.weight }}>
                  TRL-SGN-0042
                </span>
              }
              spec={`${t.mono.size}px / mono`}
            />
          </SurfaceCard>
        </DsSection>

        <DsSection title="Radius & shadow" description="Bo góc và độ nổi cho card, panel.">
          <div className="ds-token-grid">
            {Object.entries(vjTokens.radius).map(([key, value]) => (
              <div key={key} className="ds-radius-demo">
                <div className="ds-radius-demo__box" style={{ borderRadius: value }} />
                <span className="ds-radius-demo__label">radius.{key}</span>
                <span className="ds-radius-demo__value">{value}px</span>
              </div>
            ))}
          </div>
          <div className="mt-4 ds-shadow-grid">
            {Object.entries(vjTokens.shadow).map(([key, value]) => (
              <div key={key} className="ds-shadow-demo" style={{ boxShadow: value }}>
                <span>shadow.{key}</span>
              </div>
            ))}
          </div>
        </DsSection>

        <DsSection title="Primitives" description="Badge, Button, DaysBadge, Text — đọc từ vjTokens.">
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">EquipmentBadge</p>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(vjTokens.equipmentStatus) as EquipmentStatusKey[]).map((key) => (
                  <EquipmentBadge key={key} status={key} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">RepairRequestBadge</p>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(vjTokens.repairRequestStatus) as RepairRequestStatusKey[]).map((key) => (
                  <RepairRequestBadge key={key} status={key} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">DaysBadge (SLA)</p>
              <div className="flex flex-wrap gap-3">
                <DaysBadge days={3} />
                <DaysBadge days={9} />
                <DaysBadge days={16} />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">Button variants</p>
              <div className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="warning">Send to repair</Button>
                <AntButton danger>Destructive</AntButton>
                <AntButton type="link">Ghost / link</AntButton>
                <Button disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">Text tones</p>
              <div className="flex flex-col gap-1">
                <Text tone="primary">Primary text</Text>
                <Text tone="secondary">Secondary text</Text>
                <Text tone="muted">Muted text</Text>
                <Text tone="brand">Brand link</Text>
              </div>
            </div>
          </div>
        </DsSection>

        <DsSection title="Patterns" description="FilterBar, DetailHero — layout components cho list/detail pages.">
          <div className="flex flex-col gap-6">
            <FilterBar className="grid max-w-3xl grid-cols-1 gap-2 sm:grid-cols-3">
              <Input placeholder="Search…" />
              <Select placeholder="Status" options={[{ value: 'all', label: 'All' }]} />
              <Select placeholder="Station" options={[{ value: 'all', label: 'All' }]} />
            </FilterBar>
            <DetailHero
              backTo="/design-system"
              backLabel="Back"
              title="VJ-TC-0042"
              status="service"
              meta={<Text variant="bodySm" tone="secondary">Full-size · ABC Mfg · SGN</Text>}
              actions={<AntButton type="primary">Update status</AntButton>}
            />
          </div>
        </DsSection>

        <DsSection
          title="Form controls & overlays"
          description="Input, Select, Tabs, Tooltip, Dropdown, Modal — themed via vietjetAntTheme (height 40 · radius 10 · focus #F02823)."
        >
          <div className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder="Text input" aria-label="Text input demo" />
            <Input.Password placeholder="Password" aria-label="Password demo" />
            <Select
              className="w-full"
              placeholder="Select status"
              options={[
                { value: 'service', label: 'In service' },
                { value: 'repairing', label: 'Repairing' },
              ]}
              aria-label="Status select demo"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip title="Brand tooltip — max ~280px, delay short">
                <AntButton icon={<Info className="h-4 w-4" />} aria-label="Show tooltip">
                  Tooltip
                </AntButton>
              </Tooltip>
              <Dropdown
                menu={{
                  items: [
                    { key: 'edit', label: 'Edit' },
                    { key: 'duplicate', label: 'Duplicate' },
                    { type: 'divider' },
                    { key: 'delete', label: 'Delete', danger: true },
                  ],
                }}
                trigger={['click']}
              >
                <AntButton icon={<MoreHorizontal className="h-4 w-4" />} aria-label="Open dropdown menu">
                  Dropdown
                </AntButton>
              </Dropdown>
              <AntButton type="primary" onClick={() => setModalOpen(true)}>
                Open modal
              </AntButton>
            </div>
          </div>
          <div className="mt-4 max-w-3xl">
            <Tabs
              items={[
                { key: 'overview', label: 'Overview', children: <p className="text-sm text-[var(--color-text-secondary)]">Line tabs — active ink #F02823.</p> },
                { key: 'details', label: 'Details', children: <p className="text-sm text-[var(--color-text-secondary)]">Inactive tabs use secondary text.</p> },
                { key: 'history', label: 'History', children: <p className="text-sm text-[var(--color-text-secondary)]">Touch target ≥ 44pt on mobile.</p> },
              ]}
            />
          </div>
          <Modal
            title="Confirm action"
            open={modalOpen}
            onCancel={() => setModalOpen(false)}
            onOk={() => setModalOpen(false)}
            okText="Confirm"
            cancelText="Cancel"
          >
            <p className="text-sm text-[var(--color-text-secondary)]">
              Modal uses radius 12 and shadow-elevated. Primary CTA is Đỏ VJA — not yellow or navy.
            </p>
          </Modal>
        </DsSection>

        <DsSection title="KPI cards" description="Component: KpiCard — dùng trên Dashboard & reports.">
          <div className="kpi-grid kpi-grid--4">
            <KpiCard label="Total carts" value={364} hint="Full · Half breakdown" icon={ShoppingCart} tone="brand" />
            <KpiCard label="In service" value={298} hint="81.9% fleet ready" icon={CheckCircle2} tone="success" />
            <KpiCard label="Repairing" value={42} hint="Avg 4.2 days" icon={Wrench} tone="warning" />
            <KpiCard label="Not in service" value={24} hint="3 SLA overdue" icon={AlertTriangle} tone="danger" />
          </div>
        </DsSection>

        <DsSection title="Tags & alerts" description="Muted surface + text đậm — đồng bộ với equipment status badges.">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Tag color="success">Active</Tag>
              <Tag>Inactive</Tag>
              <Tag color="processing">Processing</Tag>
              <Tag color="warning">Repairing</Tag>
              <Tag color="error">Error</Tag>
            </div>
            <div className="grid max-w-2xl grid-cols-1 gap-3">
              <Alert type="success" showIcon message="Unit returned to service" description="Trolley VJ-TC-0042 marked complete." />
              <Alert type="warning" showIcon message="Repair in progress" description="Batch RR-2026-00012 — 3 units at ABC Repair." />
              <Alert type="error" showIcon message="Action failed" description="Could not update status. Try again." />
              <Alert type="info" showIcon message="Demo mode" description="Data is stored in localStorage for this preview." />
            </div>
          </div>
        </DsSection>

        <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
          Import:{' '}
          <code className="rounded bg-[var(--color-muted)] px-1.5 py-0.5">
            import {'{ vjTokens, vjBrand, vjSemantic, vjMobile }'} from '@/design-system'
          </code>
        </p>
      </div>
    </div>
  )
}
