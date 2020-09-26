/**
 * auto escape \n
 * */
import fs from 'fs'
import { Sink, Source } from './pipe'
import { Errors } from './utils'
import { iterateFdByLine, IterateFdByLineOptions } from './utils/fs'

function encode(data: string): string {
  const json = JSON.stringify(data)
  const line = json.substring(1, json.length - 1)
  return line
}

function decode(line: string): string {
  const json = `"${line}"`
  const data = JSON.parse(json)
  return data
}

/** @deprecated in favour of raw-line-file.ts for less overhead */
export class LineFileSink extends Sink<string> {
  constructor(public fd: number) {
    super()
  }

  write(data: string) {
    const line = encode(data) + '\n'
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
      const data = decode(line)
      yield data
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
    return new LineFileSource(fd, options)
  }
}
