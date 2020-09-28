import { decode as decodeValue } from 'compress-json/dist/core'
import { addValue, Key, Memory, Value } from 'compress-json/dist/memory'
import { Sink, Source } from './pipe'
import { End } from './utils'

export let Types = {
  Value: 1,
  Key: 2,
  End: 3,
}
export type Encoded = string | number | null

export function makeSinkMemory(sink: Sink<Encoded>): Memory {
  const cache = new Map()
  return {
    keyCount: 0,
    store: {
      add(value: Value) {
        sink.write(Types.Value)
        sink.write(value)
      },
      forEach(cb: (value: Value) => void | 'break') {
        throw new Error('not supported')
      },
      toArray(): Value[] {
        throw new Error('not supported')
      },
    },
    cache: {
      set(key: Key, value: Value) {
        cache.set(key, value)
      },
      forEach(cb: (key: Key, value: any) => void | 'break') {
        cache.forEach((value, key) => cb(key, value))
      },
      has(key: Key): boolean {
        return cache.has(key)
      },
      get(key: Key): Value | undefined {
        return cache.get(key)
      },
    },
  }
}

export class CompressJsonSink extends Sink<any> {
  memory = makeSinkMemory(this.sink)

  constructor(public sink: Sink<Encoded>) {
    super()
  }

  write(data: any) {
    const key = addValue(this.memory, data, undefined)
    this.sink.write(Types.Key)
    this.sink.write(key)
  }

  close() {
    this.sink.write(Types.End)
    this.sink.close()
  }
}

function decode(source: Source<Encoded>, values: Value[]): any {
  for (;;) {
    const type = source.read()
    switch (type) {
      case Types.Key: {
        const key = source.read()
        if (typeof key !== 'string') {
          console.error('invalid key, expect string, got:', key)
          throw new Error('invalid data')
        }
        const value = decodeValue(values, key)
        return value
      }
      case Types.Value: {
        const value = source.read()
        if (value !== null && typeof value !== 'string') {
          console.error('invalid value, expect string or null, got:', value)
          throw new Error('invalid value')
        }
        values.push(value)
        continue
      }
      case Types.End:
        return End
      default:
        console.error('unknown data type:', type)
        throw new Error('unknown data type')
    }
  }
}

export class CompressJsonSource extends Source<any> {
  values: Value[] = []

  constructor(public source: Source<Encoded>) {
    super()
  }

  read(): any {
    return decode(this.source, this.values)
  }

  *iterator(options?: { autoClose?: boolean }): Generator<any> {
    for (;;) {
      const value = this.read()
      if (value === End) {
        return
      }
      yield value
    }
  }

  close() {
    this.source.close()
  }
}
