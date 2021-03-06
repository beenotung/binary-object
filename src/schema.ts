import { Sink, Source } from './pipe'
import { checkUniqueTypes } from './utils'

export const Types = {
  Array: 1,
  Schema: 2,
  Object: 3,
}
checkUniqueTypes(Types)

function getSchemaId(
  sink: Sink<any>,
  schemas: Map<string, number>,
  data: any,
): number {
  const keys: any[] = Object.keys(data)
  const key = JSON.stringify(keys)
  if (schemas.has(key)) {
    return schemas.get(key)!
  }
  const id = schemas.size
  schemas.set(key, id)
  keys.push(Types.Schema)
  sink.write(keys)
  return id
}

function encodeMap(
  sink: Sink<any>,
  schemas: Map<string, number>,
  data: Map<any, any>,
): Map<any, any> {
  const res = new Map()
  for (const entry of data) {
    const key = encode(sink, schemas, entry[0])
    const value = encode(sink, schemas, entry[1])
    res.set(key, value)
  }
  return res
}

function encodeSet(
  sink: Sink<any>,
  schemas: Map<string, number>,
  data: Set<any>,
): Set<any> {
  const res = new Set()
  for (const entry of data) {
    const value = encode(sink, schemas, entry)
    res.add(value)
  }
  return res
}

function encodeArray(
  sink: Sink<any>,
  schemas: Map<string, number>,
  data: any[],
) {
  const n = data.length
  const res = new Array(n)
  for (let i = 0; i < n; i++) {
    res[i] = encode(sink, schemas, data[i])
  }
  res.push(Types.Array)
  return res
}

function encodeObject(
  sink: Sink<any>,
  schemas: Map<string, number>,
  data: object,
) {
  const schemaId = getSchemaId(sink, schemas, data)
  const values = Object.values(data).map(value => encode(sink, schemas, value))
  values.push(schemaId, Types.Object)
  return values
}

function encode(sink: Sink<any>, schemas: Map<string, number>, data: any): any {
  if (data === null || typeof data !== 'object') {
    return data
  }
  if (data instanceof Date) {
    return data
  }
  if (Buffer.isBuffer(data)) {
    return data
  }
  if (data instanceof Map) {
    return encodeMap(sink, schemas, data)
  }
  if (data instanceof Set) {
    return encodeSet(sink, schemas, data)
  }
  if (Array.isArray(data)) {
    return encodeArray(sink, schemas, data)
  }
  // really json object
  return encodeObject(sink, schemas, data)
}

export class SchemaSink extends Sink<any> {
  schemas = new Map<string, number>()

  constructor(public sink: Sink<any>) {
    super()
  }

  write(data: any) {
    data = encode(this.sink, this.schemas, data)
    this.sink.write(data)
  }

  close() {
    this.sink.close()
  }
}

function decodeObject(
  source: Source<any>,
  schemas: string[][],
  data: any[],
): object {
  const schemaId = data.pop()
  if (schemaId >= schemas.length) {
    console.error('unknown schema:', { schemaId, has: schemas.length })
    throw new Error('unknown schema')
  }
  const keys = schemas[schemaId]
  const n = keys.length
  if (n !== data.length) {
    console.error('invalid schema data:', { keys: n, values: data.length })
    throw new Error('invalid schema data')
  }
  const values = data.map(data => decode(source, schemas, data))
  const res = {} as any
  for (let i = 0; i < n; i++) {
    res[keys[i]] = values[i]
  }
  return res
}

function decodeSchema(
  source: Source<any>,
  schemas: string[][],
  data: any[],
): any {
  const type = data.pop()
  switch (type) {
    case Types.Array:
      return data.map(data => decode(source, schemas, data))
    case Types.Schema:
      schemas.push(data)
      return decode(source, schemas, source.read())
    case Types.Object:
      return decodeObject(source, schemas, data)
  }
}

function decodeMap(
  source: Source<any>,
  schemas: string[][],
  data: Map<any, any>,
) {
  const res = new Map()
  for (const entry of data) {
    const key = decode(source, schemas, entry[0])
    const value = decode(source, schemas, entry[1])
    res.set(key, value)
  }
  return res
}

function decodeSet(source: Source<any>, schemas: string[][], data: Set<any>) {
  const res = new Set()
  for (const entry of data) {
    const value = decode(source, schemas, entry)
    res.add(value)
  }
  return res
}

function decode(source: Source<any>, schemas: string[][], data: any): any {
  if (data === null || typeof data !== 'object') {
    return data
  }
  if (data instanceof Date) {
    return data
  }
  if (Buffer.isBuffer(data)) {
    return data
  }
  if (data instanceof Map) {
    return decodeMap(source, schemas, data)
  }
  if (data instanceof Set) {
    return decodeSet(source, schemas, data)
  }
  if (Array.isArray(data)) {
    return decodeSchema(source, schemas, data)
  }
  // really json object
  console.error('unsupported data:', data)
  throw new Error('unsupported data')
}

export class SchemaSource extends Source<any> {
  schemas: string[][] = []

  constructor(public source: Source<any>) {
    super()
  }

  read(): any {
    const data = this.source.read()
    return decode(this.source, this.schemas, data)
  }

  *iterator(options?: { autoClose?: boolean }): Generator<any> {
    for (const data of this.source.iterator(options)) {
      yield decode(this.source, this.schemas, data)
    }
  }

  close() {
    this.source.close()
  }
}
