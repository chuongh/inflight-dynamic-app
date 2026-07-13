import { getQuotaCache, saveQuotaCache } from '../../../mock-data/loaders/loadQuota'
import type { QuotaService } from './quotaService'

export const mockQuotaService: QuotaService = {
  async getQuotaData() {
    return getQuotaCache()
  },

  async saveQuotaData(dataset) {
    saveQuotaCache(dataset)
  },
}
