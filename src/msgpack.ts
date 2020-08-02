import { pack, unpack } from 'msgpack'
import {
  decodeNumber,
  decodeNumberOrEnd,
  encodeNumber,
  Types,
} from './binary-object'
import { BinarySink, BinarySource, End, Sink, Source } from './index'

export class MsgpackSink extends Sink<any> {
  constructor(public sink: BinarySink) {
    super()
  }

  write(data: any) {
    const buffer = pack(data) as Buffer
    encodeNumber(this.sink, buffer.byteLength)
    this.sink.writeBuffer(buffer, 0, buffer.byteLength)
  }

  close() {
    this.sink.write(Types.End)
    this.sink.close()
  }
}

export class MsgpackSource extends Source<any> {
  constructor(public source: BinarySource) {
    super()
  }

  read(): any {
    const byteLength = decodeNumber(this.source)
    const buffer = this.source.readBatch(byteLength).slice(0, byteLength)
    return unpack(buffer)
  }

  close() {
    this.source.close()
  }

  *iterator(options: { autoClose?: boolean } | undefined): Generator<any> {
    for (;;) {
      const byteLength = decodeNumberOrEnd(this.source)
      if (byteLength === End) {
        if (options?.autoClose) {
          this.source.close()
        }
        break
      }
      const buffer = this.source.readBatch(byteLength).slice(0, byteLength)
      yield unpack(buffer)
    }
  }
}
