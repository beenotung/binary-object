export function checkUniqueTypes(types: Record<string, number>) {
  const values = Object.values(types)
  const set = new Set(values)
  if (set.size !== values.length) {
    throw new Error('duplicated Type value')
  }
}

export let End = Symbol('End')
