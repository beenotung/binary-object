import { Sink, Source } from './pipe'
import { int_to_str, str_to_int } from './utils/base-62'

const WORDS = {
  cache: 'c', // first seen a value what will be cached
  key: 'k', // ref to pre-cached value
  value: 'v', // non-cached value
}

export class CacheSink<T = any> extends Sink<T> {
  shouldCache: (value: T) => boolean
  encode: (value: T) => string
  values = new Map<T, number>()

  constructor(
    public sink: Sink<string>,
    options: {
      shouldCache: (value: T) => boolean
      encode?: (value: T) => string
    },
  ) {
    super()
    this.shouldCache = options.shouldCache
    this.encode = options.encode || (data => JSON.stringify(data))
  }

  write(data: any) {
    if (!this.shouldCache(data)) {
      this.sink.write(WORDS.value + this.encode(data))
      return
    }
    if (this.values.has(data)) {
      const key = this.values.get(data)!
      this.sink.write(WORDS.key + int_to_str(key))
      return
    }
    const key = this.values.size
    this.values.set(data, key)
    this.sink.write(WORDS.cache + this.encode(data))
  }

  close() {
    this.sink.close()
  }
}

function decode<T>(
  context: {
    decode: (string: string) => T
    values: T[]
  },
  line: string,
): T {
  const word = line[0]
  const string = line.substring(1)
  switch (word) {
    case WORDS.value:
      return context.decode(string)
    case WORDS.key: {
      const key = str_to_int(string)
      return context.values[key]
    }
    case WORDS.cache: {
      const data = context.decode(string)
      context.values.push(data)
      return data
    }
    default:
      console.error({ word, data: string })
      throw new Error('unknown word')
  }
}

export class CacheSource<T = any> extends Source<T> {
  decode: (string: string) => T
  values: T[] = []

  constructor(
    public source: Source<string>,
    options?: {
      decode?: (string: string) => T
    },
  ) {
    super()
    this.decode = options?.decode || (string => JSON.parse(string))
  }

  close() {
    this.source.close()
  }

  read(): T {
    const line = this.source.read()
    return decode(this, line)
  }

  *iterator(options?: { autoClose?: boolean }): Generator<T> {
    for (const line of this.source.iterator(options)) {
      yield decode(this, line)
    }
  }
}
