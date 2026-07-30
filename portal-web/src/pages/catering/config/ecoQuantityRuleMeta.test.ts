import { describe, expect, it } from 'vitest'
import type { EcoQuantityRule } from '@/modules/catering/supplier/ecoQuantityTypes'
import { validateEcoQuantityRules } from './ecoQuantityRuleMeta'

const rule = (partial: Partial<EcoQuantityRule> = {}): EcoQuantityRule => ({
  id: 'test.ketchup',
  targetColumn: 'ketchup',
  enabled: true,
  branches: [],
  fallback: { kind: 'const', value: 0 },
  ...partial,
})

describe('validateEcoQuantityRules', () => {
  it('rejects duplicate targets, empty branches, bad route pairs, and dependency cycles', () => {
    const errors = validateEcoQuantityRules([
      rule({
        branches: [{ id: 'all', when: {}, value: { kind: 'const', value: 1 } }],
      }),
      rule({
        id: 'second-ketchup',
        branches: [{
          id: 'bad-route',
          when: { routePairs: ['SGN/MEL'] },
          value: { kind: 'column', columnId: 'chiliSauce' },
        }],
      }),
      rule({
        id: 'chili',
        targetColumn: 'chiliSauce',
        branches: [{
          id: 'cycle',
          when: { routePairs: ['SGN-MEL'] },
          value: { kind: 'column', columnId: 'ketchup' },
        }],
      }),
    ])

    expect(errors.join('\n')).toMatch(/nhiều hơn một quy tắc/)
    expect(errors.join('\n')).toMatch(/ít nhất một điều kiện/)
    expect(errors.join('\n')).toMatch(/SGN-MEL/)
    expect(errors.join('\n')).toMatch(/Vòng phụ thuộc/)
  })

  it('rejects a branch entirely covered by an earlier branch', () => {
    const errors = validateEcoQuantityRules([
      rule({
        branches: [
          { id: 'au', when: { routeGroups: ['AU'] }, value: { kind: 'const', value: 1 } },
          {
            id: 'au-a330',
            when: { routeGroups: ['AU'], aircraftFamilies: ['A330'] },
            value: { kind: 'const', value: 2 },
          },
        ],
      }),
    ])

    expect(errors.join('\n')).toMatch(/che phủ/)
  })
})
