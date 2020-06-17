import { BinarySink, BinarySource } from './binary'
import { Sink, Source } from './pipe'

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
  BinaryString: 16,
  Utf8Function: 17,
  Utf8Symbol: 18,
  DateUInt64BE: 19,
  Map: 20,
  Set: 21,
  Buffer: 22,
  Array: 23,
  Object: 24,
}

function checkTypes() {
  const values = Object.values(Types)
  const set = new Set(values)
  if (set.size !== values.length) {
    throw new Error('duplicated Type value')
  }
}

checkTypes()

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
  numberBuffer.writeFloatBE(data, 1)
  if (numberBuffer.readFloatBE(1) === data) {
    numberBuffer[0] = Types.FloatBE
    sink.writeBuffer(numberBuffer, 0, 1 + 4)
    return
  }
  numberBuffer[0] = Types.DoubleBE
  numberBuffer.writeDoubleBE(data, 1)
  sink.writeBuffer(numberBuffer, 0, 1 + 8)
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
    numberBuffer.writeInt16BE(data, 1)
    sink.writeBuffer(numberBuffer, 0, 1 + 2)
    return
  }
  if (data < 2 ** 32) {
    numberBuffer[0] = Types.UInt32BE
    numberBuffer.writeInt32BE(data, 1)
    sink.writeBuffer(numberBuffer, 0, 1 + 4)
    return
  }
  encodeUInt64BE(sink, Types.UInt64BE, data)
}

function encodeNumber(sink: BinarySink, data: number) {
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

function encodeBuffer(sink: BinarySink, data: Buffer) {
  const byteLength = data.byteLength
  encodeNumber(sink, byteLength)
  sink.writeBuffer(data, 0, byteLength)
}

function encodeBinaryString(sink: BinarySink, data: string) {
  const buffer = Buffer.from(data, 'binary')
  encodeBuffer(sink, buffer)
}

function encodeUtf8String(sink: BinarySink, data: string) {
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
    encode(sink, entry[0])
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
        sink.write(Types.DateUInt64BE)
        encodeUInt64BE(sink, Types.DateUInt64BE, data.getTime())
        break
      }
      // TODO
      if (Buffer.isBuffer(data)) {
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
  }
}

export class BinaryObjectSink extends Sink<any> {
  constructor(public sink: BinarySink) {
    super()
  }

  write(data: any) {
    encode(this.sink, data)
  }
}

function decode(source: BinarySource) {}

export class BinaryObjectSource extends Source<any> {
  constructor(public source: BinarySource) {
    super()
  }

  read(): any {
    return decode(this.source)
  }
}
