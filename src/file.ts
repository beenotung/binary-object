import fs from 'fs'
import { BinarySink } from './binary'

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
  static fromFile(file: string) {
    fs.writeFileSync(file, '')
    return new FileSink(fs.openSync(file, 'as'))
  }
}
