type CacheItem = {
  key: number
  count: number
}
type CostItem = {
  line: string
  weight: number
}

export function newCache({ maxSize }: { maxSize: number }) {
  // line -> cache item
  const caches = new Map<string, CacheItem>()
  let cacheSize = 0
  let nextKey = 0

  function addLine(line: string): { key: number; new: boolean } {
    if (caches.has(line)) {
      const item = caches.get(line)!
      item.count++
      // console.log({key:item.key,count:item.count,line:line})
      return { key: item.key, new: false }
    }
    const key = nextKey
    nextKey++
    add(line, key)
    return { key, new: true }
  }

  function add(line: string, key: number) {
    const itemSize = line.length
    if (itemSize > maxSize) {
      return
    }
    if (itemSize + cacheSize <= maxSize) {
      addCache(line, key)
      return
    }
    replace(line, key)
    return
    const costs: CostItem[] = []
    caches.forEach((item, line) => {
      costs.push({ weight: item.count * line.length, line })
    })
    // FIXME optimize this with insert-sort on linked list
    console.log('sort over', costs.length, 'caches')
    costs.sort((a, b) => b.weight - a.weight)
    while (itemSize + cacheSize > maxSize) {
      const item = costs.pop()!
      if (item.weight > itemSize / 100) {
        return
      }
      removeCache(item.line)
      // console.log('pop cache',{item})
    }
    addCache(line, key)
    console.log('replace cache', { cacheSize, key, line })
  }

  function replace(newLine: string, key: number) {
    const itemSize = newLine.length
    for (const [line, item] of caches.entries()) {
      if (Math.random() < 1 / (item.count + 5)) {
        removeCache(line)
        if (itemSize + cacheSize <= maxSize) {
          addCache(newLine, key)
          // console.log('replace cache', { cacheSize, old: line, new: newLine })
          // console.log('replace cache', { cacheSize, oldCount:item.count} )
          return
        }
      }
    }
  }

  function addCache(line: string, key: number) {
    caches.set(line, { key, count: 1 })
    cacheSize += line.length
  }

  function removeCache(line: string) {
    caches.delete(line)
    cacheSize -= line.length
  }

  return { addLine }
}
