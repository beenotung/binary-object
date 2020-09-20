/**
 * do not escape \n
 * */
import fs from 'fs'
import { Sink, Source } from './pipe'
import { Errors } from './utils'
import { iterateFdByLine, IterateFdByLineOptions } from './utils/fs'

export class RawLineFileSink extends Sink<string> {
  constructor(public fd: number) {
    super()
  }

  write(data: string) {
    const line = data + '\n'
    fs.writeSync(this.fd, line)
  }

  close() {
    fs.closeSync(this.fd)
  }

  static fromFile(file: string, flags = 'a') {
    fs.writeFileSync(file, '')
    const fd = fs.openSync(file, flags)
    return new RawLineFileSink(fd)
  }
}

export class CheckedLineFileSink extends RawLineFileSink {
  write(data: string) {
    if (data.includes('\n')) {
      throw new Error('unsupported data with newline')
    }
    const line = data + '\n'
    fs.writeSync(this.fd, line)
  }
}

export class RawLineFileSource extends Source<string> {
  generator?: Generator<string>

  constructor(public fd: number, public options?: IterateFdByLineOptions) {
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
    for (const line of iterateFdByLine(this.fd, this.options)) {
      yield line
    }
    if (options?.autoClose) {
      this.close()
    }
  }

  close() {
    fs.closeSync(this.fd)
  }

  static fromFile(file: string, flags = 'r', options?: IterateFdByLineOptions) {
    const fd = fs.openSync(file, flags)
    return new RawLineFileSource(fd, options)
  }
}
