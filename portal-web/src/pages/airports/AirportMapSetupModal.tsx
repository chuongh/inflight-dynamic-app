import { App as AntApp, Button, Input, Modal, Select, Switch, Tag } from 'antd'
import { MapPin, Plus, Send, Shapes, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Airport, AirportMap, MapPoint, MapPointType, MapZone } from '@/modules/airports/types'
import { LaterTag } from './LaterTag'

interface AirportMapSetupModalProps {
  open: boolean
  airport: Airport | null
  onCancel: () => void
  onSave: (code: string, map: AirportMap) => void
}

const POINT_TYPES: MapPointType[] = ['gate', 'apron', 'crew_center', 'hangar', 'cargo', 'parking']

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function emptyMap(): AirportMap {
  return { points: [], zones: [], published: false, version: 1 }
}

export function AirportMapSetupModal({ open, airport, onCancel, onSave }: AirportMapSetupModalProps) {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()

  const [points, setPoints] = useState<MapPoint[]>([])
  const [zones, setZones] = useState<MapZone[]>([])
  const [published, setPublished] = useState(false)
  const [version, setVersion] = useState(1)

  const [pointName, setPointName] = useState('')
  const [pointType, setPointType] = useState<MapPointType>('gate')
  const [zoneName, setZoneName] = useState('')
  const [zoneVehicles, setZoneVehicles] = useState('')

  useEffect(() => {
    if (!open) return
    const map = airport?.map ?? emptyMap()
    setPoints(map.points)
    setZones(map.zones)
    setPublished(map.published)
    setVersion(map.version)
    setPointName('')
    setPointType('gate')
    setZoneName('')
    setZoneVehicles('')
  }, [open, airport])

  const pointTypeOptions = POINT_TYPES.map((type) => ({
    value: type,
    label: t(`airports.pointType.${type}`),
  }))

  const addPoint = () => {
    const name = pointName.trim()
    if (!name) return
    setPoints((prev) => [...prev, { id: newId('pt'), name, type: pointType }])
    setPointName('')
  }

  const addZone = () => {
    const name = zoneName.trim()
    if (!name) return
    setZones((prev) => [
      ...prev,
      { id: newId('zn'), name, allowedVehicles: zoneVehicles.trim() },
    ])
    setZoneName('')
    setZoneVehicles('')
  }

  const removePoint = (id: string) => setPoints((prev) => prev.filter((p) => p.id !== id))
  const removeZone = (id: string) => setZones((prev) => prev.filter((z) => z.id !== id))

  const handleSave = (publish: boolean) => {
    if (!airport) return
    const bumpedVersion = publish && !published ? version + 1 : version
    onSave(airport.code, {
      points,
      zones,
      published: publish ? true : published,
      version: bumpedVersion,
    })
    message.success(publish ? t('airports.mapSetup.publishedMsg') : t('airports.mapSaved'))
  }

  // Lay points out on the schematic in a simple 3-column grid.
  const laidOutPoints = useMemo(
    () =>
      points.slice(0, 9).map((p, i) => ({
        ...p,
        x: 150 + (i % 3) * 210,
        y: 90 + Math.floor(i / 3) * 90,
      })),
    [points],
  )

  return (
    <Modal
      open={open}
      title={
        <span className="flex items-center gap-2">
          <MapPin size={18} className="text-vj-red" />
          {t('airports.mapSetup.title', { code: airport?.code ?? '', name: airport?.name ?? '' })}
          <LaterTag />
        </span>
      }
      width={920}
      onCancel={onCancel}
      okText={t('airports.mapSetup.publish')}
      onOk={() => handleSave(true)}
      okButtonProps={{ icon: <Send size={15} /> }}
      cancelText={t('common.cancel')}
      footer={(_, { OkBtn, CancelBtn }) => (
        <div className="flex items-center justify-between">
          <div className="airport-map-setup__version">
            {t('airports.mapSetup.version', { v: version })}
            {published ? (
              <Tag color="green" className="ml-2">
                {t('airports.mapSetup.publishedTag')}
              </Tag>
            ) : (
              <Tag className="ml-2">{t('airports.map.draft')}</Tag>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CancelBtn />
            <Button onClick={() => handleSave(false)}>{t('airports.mapSetup.saveDraft')}</Button>
            <OkBtn />
          </div>
        </div>
      )}
      destroyOnHidden
    >
      <p className="airport-map-setup__subtitle">{t('airports.mapSetup.subtitle')}</p>
      <div className="airport-map-setup__wave">{t('airports.mapSetup.waveNote')}</div>

      <div className="airport-map-setup__grid">
        {/* Left — points & zones editors */}
        <div className="airport-map-setup__panels">
          <section className="airport-map-setup__panel">
            <header className="airport-map-setup__panel-head">
              <MapPin size={15} className="text-vj-red" />
              {t('airports.mapSetup.pointsTitle')} · {points.length}
            </header>
            <div className="airport-map-setup__list thin-scroll">
              {points.length === 0 ? (
                <p className="airport-map-setup__empty">{t('airports.mapSetup.empty')}</p>
              ) : (
                points.map((p) => (
                  <div key={p.id} className="airport-layer-item">
                    <span className="airport-layer-item__pin airport-layer-item__pin--point">
                      <MapPin size={13} />
                    </span>
                    <div className="airport-layer-item__text">
                      <div className="airport-layer-item__name">{p.name}</div>
                      <div className="airport-layer-item__sub">{t(`airports.pointType.${p.type}`)}</div>
                    </div>
                    <button
                      type="button"
                      className="airport-layer-item__del"
                      aria-label={t('common.delete')}
                      onClick={() => removePoint(p.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="airport-map-setup__add">
              <Input
                value={pointName}
                onChange={(e) => setPointName(e.target.value)}
                onPressEnter={addPoint}
                placeholder={t('airports.mapSetup.pointName')}
                size="small"
              />
              <Select
                value={pointType}
                onChange={setPointType}
                options={pointTypeOptions}
                size="small"
                style={{ width: 130 }}
              />
              <Button size="small" icon={<Plus size={14} />} onClick={addPoint} />
            </div>
          </section>

          <section className="airport-map-setup__panel">
            <header className="airport-map-setup__panel-head">
              <Shapes size={15} className="text-vj-green" />
              {t('airports.mapSetup.zonesTitle')} · {zones.length}
            </header>
            <div className="airport-map-setup__list thin-scroll">
              {zones.length === 0 ? (
                <p className="airport-map-setup__empty">{t('airports.mapSetup.empty')}</p>
              ) : (
                zones.map((z) => (
                  <div key={z.id} className="airport-layer-item">
                    <span className="airport-layer-item__pin airport-layer-item__pin--zone">
                      <Shapes size={13} />
                    </span>
                    <div className="airport-layer-item__text">
                      <div className="airport-layer-item__name">{z.name}</div>
                      <div className="airport-layer-item__sub">{z.allowedVehicles || '—'}</div>
                    </div>
                    <button
                      type="button"
                      className="airport-layer-item__del"
                      aria-label={t('common.delete')}
                      onClick={() => removeZone(z.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="airport-map-setup__add airport-map-setup__add--zone">
              <Input
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder={t('airports.mapSetup.zoneName')}
                size="small"
              />
              <Input
                value={zoneVehicles}
                onChange={(e) => setZoneVehicles(e.target.value)}
                onPressEnter={addZone}
                placeholder={t('airports.mapSetup.zoneVehicles')}
                size="small"
              />
              <Button size="small" icon={<Plus size={14} />} onClick={addZone} />
            </div>
          </section>
        </div>

        {/* Right — schematic canvas + publish */}
        <div className="airport-map-setup__canvas">
          <div className="airport-map-setup__canvas-head">
            <span className="airport-map-setup__canvas-title">{t('airports.mapSetup.canvasTitle')}</span>
            <label className="airport-map-setup__publish">
              <Switch size="small" checked={published} onChange={setPublished} />
              {t('airports.mapSetup.publishToggle')}
            </label>
          </div>
          <div className="airport-map-setup__frame">
            <svg viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="apgrid" width="36" height="36" patternUnits="userSpaceOnUse">
                  <path d="M36 0H0V36" fill="none" stroke="#DCE3EA" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="720" height="360" fill="#EEF2F6" />
              <rect width="720" height="360" fill="url(#apgrid)" />
              <rect x="40" y="290" width="640" height="30" rx="4" fill="#CBD5E1" />
              <line x1="60" y1="305" x2="660" y2="305" stroke="#fff" strokeWidth="2" strokeDasharray="24 16" />
              <text x="52" y="282" fill="#64748B" fontSize="12" fontWeight="700">Runway</text>
              {zones.slice(0, 2).map((z, i) => (
                <g key={z.id}>
                  <polygon
                    points={i === 0 ? '70,60 330,54 348,180 88,192' : '400,60 650,66 640,192 410,182'}
                    fill="#87DC00"
                    fillOpacity="0.12"
                    stroke="#4A7A00"
                    strokeWidth="2"
                    strokeDasharray="6 5"
                  />
                  <text x={i === 0 ? 110 : 440} y={i === 0 ? 100 : 100} fill="#4A7A00" fontSize="12" fontWeight="800">
                    {z.name}
                  </text>
                </g>
              ))}
              <rect x="250" y="220" width="220" height="40" rx="6" fill="#94A3B8" />
              <text x="360" y="245" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle">
                {airport?.name ?? 'Terminal'}
              </text>
              {laidOutPoints.map((p) => (
                <g key={p.id} transform={`translate(${p.x}, ${p.y})`}>
                  <circle r="8" fill="#F02823" />
                  <circle r="3" fill="#fff" />
                  <text x="12" y="4" fill="#231F20" fontSize="11" fontWeight="700">
                    {p.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <p className="airport-map-setup__legend">{t('airports.mapSetup.legend')}</p>
        </div>
      </div>
    </Modal>
  )
}
