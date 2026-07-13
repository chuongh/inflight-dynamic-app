import type { QuotaDataset } from '../types'

/** Data-source-agnostic contract for the UC-10 quota dataset. */
export interface QuotaService {
  getQuotaData(): Promise<QuotaDataset>
  saveQuotaData(dataset: QuotaDataset): Promise<void>
}
