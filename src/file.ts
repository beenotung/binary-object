import fs from 'fs'
import { BinarySink, BinarySource } from './binary'

export class FileSink implements BinarySink {
  constructor(public fd: number) {}

  write(byte: number): void {
    fs.writeSync(this.fd, Buffer.from([byte]))
  }

  writeBatch(bytes: number[]): void {
    fs.writeSync(this.fd, Buffer.from(bytes))
  }

  writeBuffer(buffer: Buffer, offset: number, byteLength: number): void {
    fs.writeSync(this.fd, buffer, offset, byteLength)
  }

  writeString(string: string, encoding: BufferEncoding) {
    fs.writeSync(this.fd, string, null, encoding)
  }

  static fromFile(file: string) {
    fs.writeFileSync(file, '')
    return new FileSink(fs.openSync(file, 'as'))
  }
}

let buffer = Buffer.alloc(1)

export class FileSource implements BinarySource {
  position = 0

  constructor(public fd: number) {}

  read(): number {
    fs.readSync(this.fd, buffer, 0, 1, this.position)
    this.position++
    return buffer[0]
  }

  /**
   * may be pooled and shared
   * */
  readBatch(byteLength: number): Buffer {
    if (buffer.length < byteLength) {
      buffer = Buffer.alloc(byteLength)
    }
    fs.readSync(this.fd, buffer, 0, byteLength, this.position)
    this.position += byteLength
    return buffer
  }

  /**
   * must be offset 0 and with enough length
   *
   * will not auto resize
   * */
  readBuffer(byteLength: number, buffer: Buffer): void {
    fs.readSync(this.fd, buffer, 0, byteLength, this.position)
    this.position += byteLength
  }

  readString(byteLength: number, encoding: BufferEncoding): string {
    const buffer = this.readBatch(byteLength)
    return buffer.slice(0, byteLength).toString(encoding)
  }
}
