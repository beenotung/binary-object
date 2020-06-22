export function checkUniqueTypes(types: Record<string, number>) {
  const values = Object.values(types)
  const set = new Set(values)
  if (set.size !== values.length) {
    throw new Error('duplicated Type value')
  }
}

export let End = Symbol('End')
export type End = typeof End
export const Errors = {
  End: 'already consumed all',
}
