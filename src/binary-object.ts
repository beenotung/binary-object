import { BinarySink, BinarySource } from './binary'
import { fraction } from './number'
import { Sink, Source } from './pipe'
import { checkUniqueTypes, End } from './utils'

export let Types = {
  Undefined: 0,
  Null: 1,
  True: 2,
  False: 3,
  BigInt64BE: 4,
  BigUInt64BE: 5,
  Zero: 6,
  Negative: 7,
  NaN: 8,
  Infinity: 9,
  Byte: 10,
  UInt16BE: 11,
  UInt32BE: 12,
  UInt64BE: 13,
  FloatBE: 14,
  DoubleBE: 15,
  Fraction: 16,
  BinaryString: 17,
  Utf8Function: 18,
  Utf8Symbol: 19,
  DateUInt64BE: 20,
  Map: 21,
  Set: 22,
  Buffer: 23,
  Array: 24,
  Object: 25,
  End: 26,
}
checkUniqueTypes(Types)

/**
 * == byteSize ==
 * int16:  2
 * int32:  4
 * int64:  8
 * float:  4
 * double: 8
 *
 * offset: 1 (preserve first byte in buffer)
 * */
const numberBuffer = Buffer.alloc(1 + 8)

function encodeUInt64BE(sink: BinarySink, type: number, data: number) {
  numberBuffer[0] = type
  numberBuffer.writeBigUInt64BE(BigInt(data), 1)
  sink.writeBuffer(numberBuffer, 0, 1 + 8)
}

function encodeUFloat(sink: BinarySink, data: number) {
  /* float */
  numberBuffer.writeFloatBE(data, 1)
  if (numberBuffer.readFloatBE(1) === data) {
    numberBuffer[0] = Types.FloatBE
    sink.writeBuffer(numberBuffer, 0, 1 + 4)
    return
  }

  /* double */
  numberBuffer.writeDoubleBE(data, 1)
  if (numberBuffer.readDoubleBE(1) === data) {
    numberBuffer[0] = Types.DoubleBE
    sink.writeBuffer(numberBuffer, 0, 1 + 8)
    return
  }

  /* rational number */
  const frac = fraction(data)
  sink.write(Types.Fraction)
  encodeNumber(sink, frac[0])
  encodeNumber(sink, frac[1])
}

function encodeUInt(sink: BinarySink, data: number) {
  if (data < 2 ** 8) {
    numberBuffer[0] = Types.Byte
    numberBuffer[1] = data
    sink.writeBuffer(numberBuffer, 0, 1 + 1)
    return
  }
  if (data < 2 ** 16) {
    numberBuffer[0] = Types.UInt16BE
    numberBuffer.writeUInt16BE(data, 1)
    sink.writeBuffer(numberBuffer, 0, 1 + 2)
    return
  }
  if (data < 2 ** 32) {
    numberBuffer[0] = Types.UInt32BE
    numberBuffer.writeUInt32BE(data, 1)
    sink.writeBuffer(numberBuffer, 0, 1 + 4)
    return
  }
  encodeUInt64BE(sink, Types.UInt64BE, data)
}

export function encodeNumber(sink: BinarySink, data: number) {
  if (data === 0) {
    sink.write(Types.Zero)
    return
  }
  if (Number.isNaN(data)) {
    sink.write(Types.NaN)
    return
  }
  if (data < 0) {
    sink.write(Types.Negative)
    encodeNumber(sink, -data)
    return
  }
  if (!Number.isFinite(data)) {
    sink.write(Types.Infinity)
    return
  }
  if (Number.isInteger(data)) {
    encodeUInt(sink, data)
    return
  }
  encodeUFloat(sink, data)
}

export function encodeBuffer(sink: BinarySink, data: Buffer) {
  const byteLength = data.byteLength
  encodeNumber(sink, byteLength)
  sink.writeBuffer(data, 0, byteLength)
}

function encodeBinaryString(sink: BinarySink, data: string) {
  const buffer = Buffer.from(data, 'binary')
  encodeBuffer(sink, buffer)
}

export function encodeUtf8String(sink: BinarySink, data: string) {
  const buffer = Buffer.from(data, 'utf8')
  encodeBuffer(sink, buffer)
}

function encodeBigInt(sink: BinarySink, data: bigint) {
  if (data >= 0) {
    numberBuffer[0] = Types.BigUInt64BE
    numberBuffer.writeBigUInt64BE(data, 1)
  } else {
    numberBuffer[0] = Types.BigInt64BE
    numberBuffer.writeBigInt64BE(data, 1)
  }
  sink.writeBuffer(numberBuffer, 0, 1 + 8)
}

function encodeSymbol(sink: BinarySink, data: symbol) {
  if (data === End) {
    sink.write(Types.End)
    return
  }
  const key = Symbol.keyFor(data)
  if (key === undefined) {
    console.error('unknown symbol key:', data)
    throw new Error('symbol key not found')
  }
  sink.write(Types.Utf8Symbol)
  encodeUtf8String(sink, key)
}

function encodeMap(sink: BinarySink, data: Map<any, any>) {
  sink.write(Types.Map)
  encodeNumber(sink, data.size)
  for (const entry of data) {
    encode(sink, entry[0])
    encode(sink, entry[1])
  }
}

function encodeSet(sink: BinarySink, data: Set<any>) {
  sink.write(Types.Set)
  encode(sink, data.size)
  for (const datum of data) {
    encode(sink, datum)
  }
}

function encodeArray(sink: BinarySink, data: any[]) {
  sink.write(Types.Array)
  const n = data.length
  encode(sink, n)
  // use indexed-for-loop to not-skip empty entries
  for (let i = 0; i < n; i++) {
    encode(sink, data[i])
  }
}

function encodeObject(sink: BinarySink, data: object) {
  sink.write(Types.Object)
  const entries = Object.entries(data)
  const n = entries.length
  encodeNumber(sink, n)
  // use indexed-for-loop to skip empty check (speed up)
  for (let i = 0; i < n; i++) {
    const entry = entries[i]
    encodeUtf8String(sink, entry[0])
    encode(sink, entry[1])
  }
}

function encode(sink: BinarySink, data: any) {
  switch (typeof data) {
    case 'undefined':
      sink.write(Types.Undefined)
      break
    case 'object':
      if (data === null) {
        sink.write(Types.Null)
        break
      }
      if (data instanceof Date) {
        encodeUInt64BE(sink, Types.DateUInt64BE, data.getTime())
        break
      }
      if (Buffer.isBuffer(data)) {
        sink.write(Types.Buffer)
        encodeBuffer(sink, data)
        break
      }
      if (data instanceof Map) {
        encodeMap(sink, data)
        break
      }
      if (data instanceof Set) {
        encodeSet(sink, data)
        break
      }
      if (Array.isArray(data)) {
        encodeArray(sink, data)
        break
      }
      encodeObject(sink, data)
      break
    case 'boolean':
      sink.write(data ? Types.True : Types.False)
      break
    case 'number':
      encodeNumber(sink, data)
      break
    case 'string':
      sink.write(Types.BinaryString)
      encodeBinaryString(sink, data)
      break
    case 'function':
      sink.write(Types.Utf8Function)
      encodeUtf8String(sink, data.toString())
      break
    case 'symbol':
      encodeSymbol(sink, data)
      break
    case 'bigint':
      encodeBigInt(sink, data)
      break
    default:
      if (data === End) {
        sink.write(Types.End)
        break
      }
      console.error('unsupported data type:', data)
      throw new Error('unsupported data type')
  }
}

/**
 * support full set of javascript objects
 * including Buffer, Map, Set and Date
 *
 * but it is much slower than BinaryJsonSink, which only support JSON values
 * */
export class BinaryObjectSink extends Sink<any> {
  constructor(public sink: BinarySink) {
    super()
  }

  write(data: any) {
    encode(this.sink, data)
  }

  close() {
    encode(this.sink, End)
    this.sink.close()
  }
}

function decodeUInt64BE(source: BinarySource): number {
  source.readBuffer(8, numberBuffer)
  const data = numberBuffer.readBigUInt64BE()
  const number = Number(data)
  return number
}

export function decodeNumber(source: BinarySource): number {
  const data = decode(source)
  if (typeof data !== 'number') {
    console.error('invalid data, expect number, got:', data)
    throw new Error('invalid data')
  }
  return data
}

export function decodeNumberOrEnd(source: BinarySource) {
  const data = decode(source)
  if (data === End || typeof data === 'number') {
    return data
  }
  console.error('invalid data, expect number, got:', data)
  throw new Error('invalid data')
}

export function decodeBuffer(source: BinarySource): Buffer {
  const byteLength = decodeNumber(source)
  // cannot object the buffer from pool, because the consumer should be be impacted by pool object reuse
  const buffer = Buffer.alloc(byteLength)
  source.readBuffer(byteLength, buffer)
  return buffer
}

function decodeFraction(source: BinarySource): number {
  const a = decodeNumber(source)
  const b = decodeNumber(source)
  return a / b
}

function decodeBinaryString(source: BinarySource): string {
  const byteLength = decodeNumber(source)
  return source.readString(byteLength, 'binary')
}

export function decodeUtf8String(source: BinarySource): string {
  const byteLength = decodeNumber(source)
  return source.readString(byteLength, 'utf8')
}

// tslint:disable-next-line:ban-types
function decodeUtf8Function(source: BinarySource): Function {
  const data = decodeUtf8String(source)
  // FIXME use specific parsing to prevent XSS
  // tslint:disable-next-line:no-eval
  const func = eval('(' + data + ')')
  const type = typeof func
  if (type !== 'function') {
    console.error('invalid binary data, expected function, got:', type)
    throw new Error('invalid binary data')
  }
  return func
}

function decodeMap(source: BinarySource): Map<any, any> {
  const n = decodeNumber(source)
  const data = new Map()
  for (let i = 0; i < n; i++) {
    const key = decode(source)
    const value = decode(source)
    data.set(key, value)
  }
  return data
}

function decodeSet(source: BinarySource): Set<any> {
  const n = decodeNumber(source)
  const data = new Set()
  for (let i = 0; i < n; i++) {
    const value = decode(source)
    data.add(value)
  }
  return data
}

function decodeArray(source: BinarySource): any[] {
  const n = decodeNumber(source)
  const data = new Array(n)
  for (let i = 0; i < n; i++) {
    const value = decode(source)
    data[i] = value
  }
  return data
}

function decodeObject(source: BinarySource): object {
  const n = decodeNumber(source)
  const data: any = {}
  for (let i = 0; i < n; i++) {
    const key = decodeUtf8String(source)
    const value = decode(source)
    data[key] = value
  }
  return data
}

function decode(source: BinarySource): any {
  const type = source.read()
  switch (type) {
    case Types.Undefined:
      return undefined
    case Types.Null:
      return null
    case Types.True:
      return true
    case Types.False:
      return false
    case Types.BigInt64BE:
      return source.readBatch(8).readBigInt64BE()
    case Types.BigUInt64BE:
      return source.readBatch(8).readBigUInt64BE()
    case Types.Zero:
      return 0
    case Types.Negative:
      return -decode(source)
    case Types.NaN:
      return Number.NaN
    case Types.Infinity:
      return 1 / 0
    case Types.Byte:
      return source.read()
    case Types.UInt16BE:
      return source.readBatch(2).readUInt16BE()
    case Types.UInt32BE:
      return source.readBatch(4).readUInt32BE()
    case Types.UInt64BE:
      return Number(source.readBatch(8).readBigUInt64BE())
    case Types.FloatBE:
      return Number(source.readBatch(4).readFloatBE())
    case Types.DoubleBE:
      return Number(source.readBatch(8).readDoubleBE())
    case Types.Fraction:
      return decodeFraction(source)
    case Types.BinaryString:
      return decodeBinaryString(source)
    case Types.Utf8Function:
      return decodeUtf8Function(source)
    case Types.Utf8Symbol:
      return Symbol.for(decodeUtf8String(source))
    case Types.DateUInt64BE:
      return new Date(decodeUInt64BE(source))
    case Types.Map:
      return decodeMap(source)
    case Types.Set:
      return decodeSet(source)
    case Types.Buffer:
      return decodeBuffer(source)
    case Types.Array:
      return decodeArray(source)
    case Types.Object:
      return decodeObject(source)
    case Types.End:
      return End
    default:
      console.error('unknown binary data type:', type)
      console.error('next:', source.readString(100, 'utf8'))
      throw new Error('unknown binary data type')
  }
}

/**
 * support full set of javascript objects
 * including Buffer, Map, Set and Date
 *
 * but it is much slower than BinaryJsonSource, which only support JSON values
 * */
export class BinaryObjectSource extends Source<any> {
  constructor(public source: BinarySource) {
    super()
  }

  read(): any {
    return decode(this.source)
  }

  close() {
    this.source.close()
  }

  *iterator(options?: { autoClose?: boolean }) {
    for (;;) {
      const data = this.read()
      if (data === End) {
        if (options?.autoClose) {
          this.close()
        }
        return
      }
      yield data
    }
  }
}
