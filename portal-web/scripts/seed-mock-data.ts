import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateIpadDevices, generatePosDevices } from '../src/modules/equipment/lib/generatePortableDevices.ts'
import { generateTrolleys } from '../src/modules/equipment/lib/generateTrolleys.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const equipmentDir = join(root, 'src/mock-data/equipment')

mkdirSync(equipmentDir, { recursive: true })

const trolleys = generateTrolleys()
const posDevices = generatePosDevices()
const ipads = generateIpadDevices()

writeFileSync(join(equipmentDir, 'trolleys.json'), JSON.stringify(trolleys, null, 2))
writeFileSync(join(equipmentDir, 'pos-devices.json'), JSON.stringify(posDevices, null, 2))
writeFileSync(join(equipmentDir, 'ipads.json'), JSON.stringify(ipads, null, 2))

console.log(`Seeded ${trolleys.length} trolleys, ${posDevices.length} POS, ${ipads.length} iPads`)
