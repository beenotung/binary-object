import { Sink, Source } from './pipe'

const Type = {
  Array: 1,
  Schema: 2,
  Object: 3,
}

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
  keys.push(id, Type.Schema)
  sink.write(keys)
  return id
}

function encode(sink: Sink<any>, schemas: Map<string, number>, data: any): any {
  if (data === null || typeof data !== 'object') {
    return data
  }
  if (Array.isArray(data)) {
    const array = data.map(data => encode(sink, schemas, data))
    array.push(Type.Array)
    return array
  }
  {
    // is object
    const schemaId = getSchemaId(sink, schemas, data)
    const values = Object.values(data)
    values.push(schemaId, Type.Object)
    return values
  }
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
}

function decodeSchema(schemas: string[][], data: any[]) {
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
  const res = {} as any
  for (let i = 0; i < n; i++) {
    res[keys[i]] = data[i]
  }
  return res
}

function read(source: Source<any>, schemas: string[][]) {
  const data = source.read()
  if (data === null || typeof data !== 'object') {
    return data
  }
  if (!Array.isArray(data)) {
    console.error('unsupported data:', data)
    throw new Error('unsupported data')
  }
  const type = data.pop()
  switch (type) {
    case Type.Array:
      return data
    case Type.Schema:
      schemas.push(data)
      return read(source, schemas)
    case Type.Object:
      return decodeSchema(schemas, data)
  }
}

export class SchemaSource extends Source<any> {
  schemas: string[][] = []

  constructor(public source: Source<any>) {
    super()
  }

  read(): any {
    return read(this.source, this.schemas)
  }
}
