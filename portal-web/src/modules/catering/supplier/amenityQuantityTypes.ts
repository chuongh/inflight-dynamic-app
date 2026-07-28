export interface AmenityProduct {
  code: string
  name: string
  unit: string
  spec?: string | null
  price?: number | string | null
}

export interface AmenityPackageCompositionItem {
  productCode: string
  /** number = fixed qty; string notes are stored separately as periodic topups */
  quantity: number | string
}

export interface AmenityPackageComposition {
  packageId: number
  items: AmenityPackageCompositionItem[]
}
