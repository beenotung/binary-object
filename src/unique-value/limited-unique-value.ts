import { Sink } from '../pipe'
import { int_to_str } from '../utils/base-62'
// import {  newCache } from './weighted-cache'
import { newCache } from './freq-cache'
import { encode, WORDS } from './unique-value'

export type Cache = ReturnType<typeof newCache>
type EncodeContext = {
  sink: Sink<string>
  cache: Cache
  lines: number
}

function writeLine(line: string, context: EncodeContext) {
  const cache = context.cache
  const res = cache.addLine(line)
  if (!res.new) {
    return res.key
  }
  context.sink.write(line)
  context.lines++
  return res.key
}

export class LimitedUniqueValueSink extends Sink<any> {
  cache: Cache
  lines = 0

  constructor(public sink: Sink<string>, options: { maxSize: number }) {
    super()
    this.cache = newCache(options)
  }

  write(data: any) {
    const key = encode(data, line => writeLine(line, this))
    if (key === this.lines - 1) {
      this.sink.write(WORDS.pop)
    } else {
      this.sink.write(WORDS.emit + int_to_str(key))
    }
  }

  close() {
    this.sink.close()
  }
}
