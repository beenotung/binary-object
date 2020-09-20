import { addValue, decode, Memory } from 'compress-json'
import { makeInMemoryCache, Value } from 'compress-json/dist/memory'
import { Sink, Source } from './pipe'
import { Errors } from './utils'

function createSinkMemory(sink: Sink<string>): Memory {
  return {
    cache: makeInMemoryCache(),
    keyCount: 0,
    store: {
      add(value: Value) {
        if (value === null) {
          sink.write('k|')
        } else {
          sink.write(value)
        }
      },
      forEach(cb: (value: Value) => void | 'break') {
        throw new Error('not supported')
      },
      toArray(): Value[] {
        throw new Error('not supported')
      },
    },
  }
}

function encode(sink: Sink<string>, memory: Memory, data: any) {
  if (data === null) {
    sink.write('k|')
    return
  }
  const key = addValue(memory, data, undefined)
  sink.write('k|' + key)
}

/** @deprecated in favour of unique-value.ts for better better disk-efficiency and speed */
export class ContinuousCompressJsonSink extends Sink<any> {
  memory = createSinkMemory(this.sink)

  constructor(public sink: Sink<string>) {
    super()
  }

  write(data: any) {
    encode(this.sink, this.memory, data)
  }

  close() {
    this.sink.close()
  }
}

function decodeSource(source: Source<string>, values: Value[]) {
  for (;;) {
    const data = source.read()
    if (data.startsWith('k|')) {
      const key = data.substr(2)
      if (key === '') {
        return null
      }
      return decode(values, key)
    }
    values.push(data)
  }
}

export class ContinuousCompressJsonSource extends Source<any> {
  values: Value[] = []

  constructor(public source: Source<string>) {
    super()
  }

  read(): any {
    return decodeSource(this.source, this.values)
  }

  *iterator(options?: { autoClose?: boolean }): Generator<any> {
    for (;;) {
      try {
        yield this.read()
      } catch (e) {
        if (e.toString() === 'Error: ' + Errors.End) {
          return
        }
        throw e
      }
    }
  }

  close() {
    this.source.close()
  }
}
