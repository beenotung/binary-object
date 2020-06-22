import fs from 'fs'
import { Sink, Source } from './pipe'
import { Errors } from './utils'

export class LineFileSink extends Sink<string> {
  constructor(public fd: number) {
    super()
  }

  write(data: string) {
    const line = data.replace(/\\/g, '\\\\').replace(/\n/g, '\\n') + '\n'
    fs.writeSync(this.fd, line)
  }

  close() {
    fs.closeSync(this.fd)
  }

  static fromFile(file: string, flags = 'a') {
    fs.writeFileSync(file, '')
    const fd = fs.openSync(file, flags)
    return new LineFileSink(fd)
  }
}

export class LineFileSource extends Source<string> {
  generator?: Generator<string>
  constructor(public fd: number) {
    super()
  }

  read(): string {
    if (!this.generator) {
      this.generator = this.iterator({ autoClose: false })
    }
    const res = this.generator.next()
    if (res.done) {
      throw new Error(Errors.End)
    }
    return res.value
  }

  *iterator(options?: { autoClose?: boolean }): Generator<string> {
    for (const data of fs.readFileSync(this.fd).toString().split('\n')) {
      yield data
    }
    if (options?.autoClose) {
      this.close()
    }
  }

  close() {
    fs.closeSync(this.fd)
  }

  static fromFile(file: string, flags = 'r') {
    const fd = fs.openSync(file, flags)
    return new LineFileSource(fd)
  }
}
