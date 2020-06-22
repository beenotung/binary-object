import { compress, decompress } from 'compress-json'
import { s_to_int } from 'compress-json/dist/number'
import { Sink, Source } from './pipe'
import { Errors } from './utils'

function encode(sink: Sink<string>, data: any) {
  if (data === null) {
    sink.write('')
    return
  }
  const [values, key] = compress(data)
  sink.write(key)
  for (const value of values) {
    if (value === null) {
      sink.write('')
    } else {
      sink.write(value)
    }
  }
}

export class CompressJsonSink extends Sink<any> {
  constructor(public sink: Sink<string>) {
    super()
  }

  write(data: any) {
    encode(this.sink, data)
  }

  close() {
    this.sink.close()
  }
}

function decode(source: Source<string>, key: string) {
  if (key === '') {
    return null
  }
  const n = s_to_int(key) + 1
  console.log({ n, key })
  const values: string[] = new Array(n)
  for (let i = 0; i < n; i++) {
    const value = source.read()
    values[i] = value
  }
  return decompress([values, key])
}

export class CompressJsonSource extends Source<any> {
  constructor(public source: Source<string>) {
    super()
  }

  read(): any {
    return decode(this.source, this.source.read())
  }

  *iterator(options?: { autoClose?: boolean }): Generator<any> {
    for (;;) {
      try {
        yield this.read()
      } catch (e) {
        if (e.toString() === Errors.End) {
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
