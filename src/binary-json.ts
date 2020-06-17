import { BinarySink, BinarySource } from './binary'
import { decodeNumber, encodeNumber, End } from './binary-object'
import { Sink, Source } from './pipe'

/**
 * only support JSON values
 * e.g. don't support Buffer, Map, Set and Date
 *
 * This is much faster than BinaryObjectSink, but that support full set of javascript objects
 * */
export class BinaryJsonSink extends Sink<any> {
  constructor(public sink: BinarySink) {
    super()
  }

  write(data: any) {
    if (data === undefined) {
      data = null
    }
    const buffer = Buffer.from(JSON.stringify(data), 'utf8')
    const byteLength = buffer.byteLength
    encodeNumber(this.sink, byteLength)
    this.sink.writeBuffer(buffer, 0, byteLength)
  }

  close() {
    encodeNumber(this.sink, 0)
    this.sink.close()
  }
}

/**
 * only support JSON values
 * e.g. don't support Buffer, Map, Set and Date
 *
 * This is much faster than BinaryObjectSource, but that support full set of javascript objects
 * */
export class BinaryJsonSource extends Source<any> {
  constructor(public source: BinarySource) {
    super()
  }

  read(): any {
    const byteLength = decodeNumber(this.source)
    if (byteLength === 0) {
      return End
    }
    return JSON.parse(this.source.readString(byteLength, 'utf8'))
  }

  close() {
    this.source.close()
  }

  *iterator(options?: { autoClose?: boolean }) {
    for (;;) {
      const byteLength = decodeNumber(this.source)
      if (byteLength === 0) {
        if (options?.autoClose) {
          this.close()
        }
        return
      }
      yield JSON.parse(this.source.readString(byteLength, 'utf8'))
    }
  }
}
