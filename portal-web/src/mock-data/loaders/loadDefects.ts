import defectCatalog from '../defects/defect-catalog.json'
import type { DefectCatalogItem } from '../../modules/equipment/types'

export function loadDefectCatalog(): DefectCatalogItem[] {
  return defectCatalog as DefectCatalogItem[]
}
