import { pack, unpack } from 'msgpack'
import { decodeNumber, encodeNumber } from './binary-object'
import { BinarySink, BinarySource, Sink, Source } from './index'

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
}
