type CacheItem = {
  key: number
  count: number
}
type CacheList = CacheItem & {
  next: CacheList
}

function newLineCache({ maxSize }: { maxSize: number }) {
  // line -> cache item
  const cache = new Map<string, CacheItem>()
  let cacheSize = 0
  let nextKey = 0

  function addLine(line: string): number {
    if (cache.has(line)) {
      return cache.get(line)!.key
    }
    const key = nextKey
    nextKey++
    if (line.length > maxSize) {
      return key
    }

    cache.set(line, { key, count: 1 })
    cacheSize += line.length
    return key
  }

  return {
    addLine,
  }
}
