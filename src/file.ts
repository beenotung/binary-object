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

  close() {
    fs.closeSync(this.fd)
  }

  static fromFile(file: string, flags = 'a') {
    fs.writeFileSync(file, '')
    const fd = fs.openSync(file, flags)
    return new FileSink(fd)
  }
}

let buffer = Buffer.alloc(1)

export class FileSource implements BinarySource {
  position = 0

  constructor(public fd: number) {}

  read(): number {
    // console.log('read from', this.position)
    fs.readSync(this.fd, buffer, 0, 1, this.position)
    this.position++
    return buffer[0]
  }

  /**
   * may be pooled and shared
   * */
  readBatch(byteLength: number): Buffer {
    // console.log('read', byteLength, 'bytes from', this.position)
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
    // console.log('read', byteLength, 'bytes from', this.position)
    fs.readSync(this.fd, buffer, 0, byteLength, this.position)
    this.position += byteLength
  }

  readString(byteLength: number, encoding: BufferEncoding): string {
    const buffer = this.readBatch(byteLength)
    return buffer.slice(0, byteLength).toString(encoding)
  }

  close() {
    fs.closeSync(this.fd)
  }

  static fromFile(file: string, flags = 'r') {
    const fd = fs.openSync(file, flags)
    return new FileSource(fd)
  }
}
