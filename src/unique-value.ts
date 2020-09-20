/**
 * current only support undefined and primitive json data types
 *
 * supported:
 *   - undefined
 *   - null
 *   - string
 *   - number
 *   - array
 *   - object
 *   - boolean
 *
 * not supported:
 *   - Map
 *   - Set
 *   - Date
 *   - Symbol
 *   - bigint
 *   e.t.c.
 * (doesn't support Map, Set, Date, Symbol, bigint, e.t.c.)
 * */
import { Sink, Source } from './pipe'
import { checkUniqueTypes, Errors } from './utils'
import { int_to_str, str_to_int } from './utils/base-62'

const WORDS = {
  array: 'a',
  object: 'o',
  value: 'v',
  emit: 'e',
  pop: 'p',
  null: 'n',
  undefined: 'u',
  true: 't',
  false: 'f',
}
checkUniqueTypes(WORDS)
type Key = number
type EncodeContext = {
  sink: Sink<string>

  // line -> key
  linesKeys: Map<string, Key>
}

function writeLine(context: EncodeContext, line: string): Key {
  const linesKeys = context.linesKeys
  if (linesKeys.has(line)) {
    return linesKeys.get(line)!
  }
  const key = linesKeys.size
  linesKeys.set(line, key)
  context.sink.write(line)
  return key
}

function encode(context: EncodeContext, value: any): Key {
  switch (value) {
    case null:
      return writeLine(context, WORDS.null)
    case undefined:
      return writeLine(context, WORDS.undefined)
    case true:
      return writeLine(context, WORDS.true)
    case false:
      return writeLine(context, WORDS.false)
  }
  if (Array.isArray(value)) {
    const values: string[] = value.map(value =>
      int_to_str(encode(context, value)),
    )
    return writeLine(context, WORDS.array + values.join(','))
  }
  if (typeof value === 'object') {
    const keys: string[] = Object.keys(value).map((key: string) =>
      int_to_str(encode(context, key)),
    )
    const values: string[] = Object.values(value).map((value: any) =>
      int_to_str(encode(context, value)),
    )
    return writeLine(context, WORDS.object + [...keys, ...values].join(','))
  }
  return writeLine(context, WORDS.value + JSON.stringify(value))
}

export class UniqueValueSink extends Sink<any> {
  // line -> key
  linesKeys = new Map<string, Key>()

  constructor(public sink: Sink<string>) {
    super()
  }

  write(data: any) {
    const key = encode(this, data)
    if (key === this.linesKeys.size - 1) {
      this.sink.write(WORDS.pop)
    } else {
      this.sink.write(WORDS.emit + int_to_str(key))
    }
  }

  close() {
    this.sink.close()
  }
}

type DecodeContext = {
  source: Source<string>

  // key -> line
  lines: Map<Key, string>
}

function decode(context: DecodeContext, line: string): any {
  switch (line) {
    case WORDS.null:
      return null
    case WORDS.undefined:
      return undefined
    case WORDS.true:
      return true
    case WORDS.false:
      return false
  }
  const type = line[0]
  const data = line.substring(1)
  switch (type) {
    case WORDS.array: {
      const lines = context.lines
      const values = data
        .split(',')
        .map(key => decode(context, lines.get(str_to_int(key))!))
      return values
    }
    case WORDS.object: {
      const lines = context.lines
      const keyValues = data
        .split(',')
        .map(key => decode(context, lines.get(str_to_int(key))!))
      const n = keyValues.length / 2
      const object: any = {}
      for (let i = 0; i < n; i++) {
        const key = keyValues[i]
        const value = keyValues[i + n]
        object[key] = value
      }
      return object
    }
    case WORDS.value:
      return JSON.parse(data)
    default: {
      console.error('invalid line:', { type, line })
      throw new Error('invalid line')
    }
  }
}

export class UniqueValueSource extends Source<any> {
  generator?: Generator<any>
  lines = new Map<Key, string>()

  constructor(public source: Source<string>) {
    super()
  }

  read(): any {
    if (!this.generator) {
      this.generator = this.iterator({ autoClose: false })
    }
    const res = this.generator.next()
    if (res.done) {
      throw new Error(Errors.End)
    }
    return res.value
  }

  *iterator(options?: { autoClose?: boolean }): Generator<any> {
    const lines = this.lines
    for (const line of this.source.iterator(options)) {
      const key = lines.size
      if (line === WORDS.pop) {
        const lastKey = key - 1
        const lastLine = lines.get(lastKey)!
        yield decode(this, lastLine)
        continue
      }
      const type = line[0]
      if (type === WORDS.emit) {
        const dataKey = str_to_int(line.substring(1))
        const dataLine = lines.get(dataKey)!
        yield decode(this, dataLine)
        continue
      }
      lines.set(key, line)
    }
  }

  close() {
    this.source.close()
  }
}
