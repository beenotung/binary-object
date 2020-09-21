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
import { Sink, Source } from '../pipe'
import { checkUniqueTypes, Errors } from '../utils'
import { int_to_str, str_to_int } from '../utils/base-62'

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
export type Key = number
export type Dict<K, V> = {
  has(key: K): boolean
  get(key: K): V | undefined
  set(key: K, value: V): void
  count(): number
}

export type UniqueValueWriteLog = {
  getKey(line: string): Key | null
  write(line: string): Key
  count(): number
  close?: () => void
}

function writeLine(writeLog: UniqueValueWriteLog, line: string): Key {
  console.log('writeLine', { line })
  const key = writeLog.getKey(line)
  console.log('writeLine', { key })
  if (key !== null) {
    return key
  }
  return writeLog.write(line)
}

function encode(writeLog: UniqueValueWriteLog, value: any): Key {
  console.log('encode', { value })
  switch (value) {
    case null:
      return writeLine(writeLog, WORDS.null)
    case undefined:
      return writeLine(writeLog, WORDS.undefined)
    case true:
      return writeLine(writeLog, WORDS.true)
    case false:
      return writeLine(writeLog, WORDS.false)
  }
  if (Array.isArray(value)) {
    const values: string[] = value.map(value =>
      int_to_str(encode(writeLog, value)),
    )
    return writeLine(writeLog, WORDS.array + values.join(','))
  }
  if (typeof value === 'object') {
    const keys: string[] = Object.keys(value).map((key: string) =>
      int_to_str(encode(writeLog, key)),
    )
    const values: string[] = Object.values(value).map((value: any) =>
      int_to_str(encode(writeLog, value)),
    )
    return writeLine(writeLog, WORDS.object + [...keys, ...values].join(','))
  }
  return writeLine(writeLog, WORDS.value + JSON.stringify(value))
}

export class AbstractUniqueValueSink extends Sink<any> {
  constructor(public sink: UniqueValueWriteLog) {
    super()
  }

  write(data: any) {
    const key = encode(this.sink, data)
    if (key === this.sink.count() - 1) {
      this.sink.write(WORDS.pop)
    } else {
      this.sink.write(WORDS.emit + int_to_str(key))
    }
  }

  close() {
    this.sink.close?.()
  }
}

type DecodeContext = {
  // key -> line
  lines: Dict<Key, string>
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

export class AbstractUniqueValueSource extends Source<any> {
  generator?: Generator<any>

  constructor(public lines: Dict<Key, string>) {
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
    let count = this.lines.count()
    console.log('source iterator', { count })
    for (let i = 0; i < count; i++) {
      const key = i + 1
      const line = lines.get(key)!
      console.log('source iterator', { key, line })
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
      // lines.set(key, line)
    }
  }

  close() {}
}
