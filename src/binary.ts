export interface BinarySink {
  write(byte: number): void

  writeBatch(bytes: number[]): void

  writeBuffer(buffer: Buffer, offset: number, byteLength: number): void

  writeString(string: string, encoding: BufferEncoding): void

  close(): void
}

export interface BinarySource {
  read(): number

  /**
   * may be pooled and shared
   * */
  readBatch(byteLength: number): Buffer

  /**
   * must be offset 0 and with enough length
   *
   * will not auto resize
   * */
  readBuffer(byteLength: number, buffer: Buffer): void

  readString(byteLength: number, encoding: BufferEncoding): string

  close(): void
}
