import { Types } from '../src/binary-object'

export function getTypeName(type: number) {
  for (const entry of Object.entries(Types)) {
    if (entry[1] === type) {
      return entry[0]
    }
  }
  console.error('unknown type:', type)
  throw new Error('unknown type')
}
