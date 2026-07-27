// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildSupplierExportFilename,
  downloadXlsx,
} from './download'

describe('supplier XLSX download', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds normalized station, product, and date filenames', () => {
    expect(buildSupplierExportFilename('sgn', 'eco', '2026-07-08')).toBe(
      'GC-SGN-ECO-20260708.xlsx',
    )
    expect(buildSupplierExportFilename('SGN', 'sbb', '08/07/2026')).toBe(
      'GC-SGN-SBB-20260708.xlsx',
    )
  })

  it('appends, clicks, removes, then asynchronously revokes its Blob URL', async () => {
    const anchor = document.createElement('a')
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => undefined)
    const remove = vi.spyOn(anchor, 'remove')
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    const createObjectURL = vi.fn(() => 'blob:test')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    })

    downloadXlsx(new Uint8Array([1, 2, 3]), 'file.xlsx')

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(anchor).toMatchObject({ href: 'blob:test', download: 'file.xlsx' })
    expect(click).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledOnce()
    expect(document.body.contains(anchor)).toBe(false)
    expect(revokeObjectURL).not.toHaveBeenCalled()

    await Promise.resolve()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
  })
})
