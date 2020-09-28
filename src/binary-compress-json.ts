import { decode as decodeValue } from 'compress-json/dist/core'
import { addValue, Key, Memory, Value } from 'compress-json/dist/memory'
import { iterateSamples, sampleCount } from '../test/sample'
import { BinarySink, BinarySource } from './binary'
import { decodeUtf8String, encodeUtf8String } from './binary-object'
import { FileSink, FileSource } from './file'
import { Sink, Source } from './pipe'
import { End } from './utils'

export let Types = {
  ValueUtf8String: 1,
  ValueNull: 2,
  Key: 3,
  End: 4,
}

export function makeSinkMemory(sink: BinarySink): Memory {
  const cache = new Map()
  return {
    keyCount: 0,
    store: {
      add(value: Value) {
        if (value === null) {
          sink.write(Types.ValueNull)
          return
        }
        sink.write(Types.ValueUtf8String)
        encodeUtf8String(sink, value)
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

export class BinaryCompressJsonSink extends Sink<any> {
  memory = makeSinkMemory(this.sink)

  constructor(public sink: BinarySink) {
    super()
  }

  write(data: any) {
    const key = addValue(this.memory, data, undefined)
    this.sink.write(Types.Key)
    encodeUtf8String(this.sink, key)
  }

  close() {
    this.sink.write(Types.End)
    this.sink.close()
  }
}

function decode(source: BinarySource, values: Value[]): any {
  for (;;) {
    const type = source.read()
    switch (type) {
      case Types.ValueNull:
        values.push(null)
        continue
      case Types.ValueUtf8String:
        values.push(decodeUtf8String(source))
        continue
      case Types.Key: {
        const key = decodeUtf8String(source)
        const value = decodeValue(values, key)
        return value
      }
      case Types.End:
        return End
      default:
        console.error('unknown data type:', type)
        throw new Error('unknown data type')
    }
  }
}

export class BinaryCompressJsonSource extends Source<any> {
  values: Value[] = []

  constructor(public source: BinarySource) {
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

export function testSink() {
  const sink = new BinaryCompressJsonSink(FileSink.fromFile('db.log'))
  let i = 0
  for (const { key, value } of iterateSamples()) {
    i++
    if (Math.random() < 1 / 1000) {
      console.log(i, '/', sampleCount)
    }
    sink.write(key)
    sink.write(value)
  }
}

export function testSource() {
  const source = new BinaryCompressJsonSource(FileSource.fromFile('db.log'))
  let i = 0
  console.log({ n: sampleCount })
  for (;;) {
    i++
    if (Math.random() < 1 / 1000) {
      console.log(i, '/', sampleCount)
    }
    const key = source.read()
    if (key === End) {
      break
    }
    const value = source.read()
    // console.log({ key, value })
  }
  source.close()
  console.log('done')
}

export function test() {
  // testSink()
  testSource()
}

// test()
