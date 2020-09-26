import { Sink } from '../pipe'
import { checkUniqueTypes } from '../utils'
import { int_to_str } from '../utils/base-62'
import { newCache } from './cache'
import { encode, WORDS as _WORDS } from './unique-value'

const WORDS = {
  ..._WORDS,
  drop: 'd',
}
checkUniqueTypes(WORDS)

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

  constructor(options: { maxSize: number }, public sink: Sink<string>) {
    super()
    this.cache = newCache({
      maxSize: options.maxSize,
      drop: key => this.sink.write(WORDS.drop + int_to_str(key)),
    })
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
