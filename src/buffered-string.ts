import { Sink } from './pipe'

export class BufferedStringSink extends Sink<string> {
  usedSize: number = 0
  buffer: string[] = []

  constructor(
    public options: {
      bufferSize: number
      separator: string
    },
    public sink: Sink<string>,
  ) {
    super()
  }

  close() {
    if (this.usedSize > 0) {
      this.flush()
    }
    this.sink.close()
  }

  write(data: string) {
    this.buffer.push(data)
    this.usedSize += data.length
    if (this.usedSize < this.options.bufferSize) {
      return
    }
    this.flush()
  }

  private flush() {
    const data = this.buffer.join(this.options.separator)
    this.sink.write(data)
    this.buffer = []
  }
}
