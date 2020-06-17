import net, { Socket } from 'net'
import { BinarySink } from './binary'

export class NetSink implements BinarySink {
  p = Promise.resolve()

  constructor(public sink: Socket) {}

  // TODO pool the buffer
  write(byte: number) {
    this.writeBatch([byte])
  }

  // TODO pool the buffer
  writeBatch(bytes: number[]) {
    this.writeBuffer(Buffer.from(bytes), 0, bytes.length)
  }

  // TODO pool the buffer
  writeString(string: string, encoding: BufferEncoding) {
    const buffer = Buffer.from(string, encoding)
    this.writeBuffer(buffer, 0, buffer.byteLength)
  }

  writeBuffer(buffer: Buffer, offset: number, byteLength: number) {
    this.p = this.p.then(
      () =>
        new Promise((resolve, reject) => {
          this.sink.write(buffer, err => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        }),
    )
  }

  close() {
    this.sink.end()
  }

  static createClient(port: number, host: string) {
    const socket = net.createConnection(port, host)
  }
}

// TODO work out async version of source
export class NetSource {
  constructor(public source: Socket) {}

  close(): void {
    this.source.end()
  }

  read(cb: (buffer: Buffer) => void): number {
    this.source.on('data', data => {
      data.slice()
    })
    this.source.read(1)
    return 0
  }

  readBatch(byteLength: number): Buffer {
    return undefined
  }

  readBuffer(byteLength: number, buffer: Buffer): void {}

  readString(byteLength: number, encoding: BufferEncoding): string {
    return ''
  }
}
