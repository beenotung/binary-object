import { Types } from './utils'

function ensureBufferSize(buffer: Buffer, byteLength: number): Buffer {
  if (buffer.byteLength >= byteLength) {
    return buffer
  }
  return Buffer.alloc(byteLength)
}

/**
 * offset 1 (preserve first byte in buffer)
 * */
function encodeUInt64(
  type: number,
  number: number,
  buffer: Buffer,
  offset: number,
): BufferResult {
  const byteLength = offset + 1 + 8
  buffer = ensureBufferSize(buffer, byteLength)
  buffer[offset] = type
  buffer.writeBigUInt64BE(BigInt(number), offset + 1)
  return { buffer, byteLength }
}

function encodeUInt(
  number: number,
  buffer: Buffer,
  offset: number,
): BufferResult {
  let byteLength: number
  if (number < 2 ** 8) {
    byteLength = offset + 1 + 1
    buffer = ensureBufferSize(buffer, byteLength)
    buffer[offset] = Types.Byte
    buffer[offset + 1] = number
    return { buffer, byteLength }
  }
  if (number < 2 ** 16) {
    byteLength = offset + 1 + 2
    buffer = ensureBufferSize(buffer, byteLength)
    buffer[offset] = Types.UInt16BE
    buffer.writeUInt16BE(number, offset + 1)
    return { buffer, byteLength }
  }
  if (number < 2 ** 32) {
    byteLength = offset + 1 + 4
    buffer = ensureBufferSize(buffer, byteLength)
    buffer[offset] = Types.UInt32BE
    buffer.writeUInt32BE(number, offset + 1)
    return { buffer, byteLength }
  }
  return encodeUInt64(Types.UInt64BE, number, buffer, offset)
}

function encodeUFloat(
  number: number,
  buffer: Buffer,
  offset: number,
): BufferResult {
  /* float */
  let byteLength = offset + 1 + 4
  buffer = ensureBufferSize(buffer, byteLength)
  buffer.writeFloatBE(number, offset + 1)
  if (buffer.readFloatBE(offset + 1) === number) {
    buffer[offset] = Types.FloatBE
    return { buffer, byteLength }
  }
  /* double */
  byteLength = offset + 1 + 8
  buffer = ensureBufferSize(buffer, byteLength)
  buffer[offset] = Types.DoubleBE
  buffer.writeDoubleBE(number, offset + 1)
  return { buffer, byteLength }
}

function encodeNumber(
  number: number,
  buffer: Buffer,
  offset: number,
): BufferResult {
  if (number === 0) {
    return copyByte(Types.Zero, buffer, offset)
  }
  if (Number.isNaN(number)) {
    return copyByte(Types.NaN, buffer, offset)
  }
  if (number < 0) {
    const res = encodeNumber(-number, buffer, offset + 1)
    res.buffer[offset] = Types.Negative
    return res
  }
  if (!Number.isFinite(number)) {
    return copyByte(Types.Infinity, buffer, offset)
  }
  if (Number.isInteger(number)) {
    return encodeUInt(number, buffer, offset)
  }
  return encodeUFloat(number, buffer, offset)
}

// to reuse the buffer, allocate a larger one if needed
export type BufferResult = { buffer: Buffer; byteLength: number }

function copyBytesToBuffer(
  bytes: number[],
  buffer: Buffer,
  offset: number,
): BufferResult {
  const byteLength = offset + bytes.length
  buffer = ensureBufferSize(buffer, byteLength)
  for (let i = 0; i < byteLength; i++) {
    buffer[i] = bytes[offset + i]
  }
  return { buffer, byteLength }
}

/**
 * offset 1 (preserve first byte in buffer)
 * */
function copyBuffer(
  type: number,
  data: Buffer,
  buffer: Buffer,
  offset: number,
): BufferResult {
  /* type */
  let res = copyByte(type, buffer, offset)
  offset += 1

  /* length */
  res = encodeNumber(data.length, res.buffer, offset)
  offset = res.byteLength

  /* payload */
  data.copy(res.buffer, offset)
  return { buffer: res.buffer, byteLength: offset + data.length }
}

/**
 * offset 1 (preserve first byte in buffer)
 * */
function encodeString(
  type: number,
  string: string,
  buffer: Buffer,
  offset: number,
): BufferResult {
  const data = Buffer.from(string, 'utf-8')
  return copyBuffer(type, data, buffer, offset)
}

function copyByte(data: number, buffer: Buffer, offset: number): BufferResult {
  const byteLength = offset + 1
  buffer = ensureBufferSize(buffer, byteLength)
  buffer[offset] = data
  return { buffer, byteLength }
}

export function encode(
  data: any,
  buffer: Buffer,
  offset: number,
): BufferResult {
  let byteLength: number
  switch (typeof data) {
    case 'undefined':
      return copyByte(Types.Undefined, buffer, offset)
    case 'object':
      if (data === null) {
        return copyByte(Types.Null, buffer, offset)
      }
      if (data instanceof Date) {
        return encodeUInt64(Types.DateUInt64BE, data.getTime(), buffer, offset)
      }
      if (Buffer.isBuffer(data)) {
        return copyBuffer(Types.Buffer, data, buffer, offset)
      }
      if (data instanceof Map) {
        let res = copyByte(Types.Map, buffer, offset)
        const entries = Array.from(data.entries())
        res = encodeNumber(entries.length, res.buffer, res.byteLength)
        for (const entry of entries) {
          res = encode(entry[0], res.buffer, res.byteLength) // key
          res = encode(entry[1], res.buffer, res.byteLength) // value
        }
        return res
      }
      if (data instanceof Set) {
        let res = copyByte(Types.Set, buffer, offset)
        const array = Array.from(data)
        res = encodeNumber(array.length, res.buffer, res.byteLength)
        for (const data of array) {
          res = encode(data, res.buffer, res.byteLength)
        }
        return res
      }
      if (Array.isArray(data)) {
        let res = copyByte(Types.Array, buffer, offset)
        const n = data.length
        res = encodeNumber(n, res.buffer, res.byteLength)
        for (let i = 0; i < n; i++) {
          // use for-i to not-skip empty entries
          res = encode(data[i], res.buffer, res.byteLength)
        }
        return res
      }
      {
        // object
        let res = copyByte(Types.Object, buffer, offset)
        const entries = Object.entries(data)
        res = encodeNumber(entries.length, res.buffer, res.byteLength)
        for (const entry of entries) {
          res = encode(entry[0], res.buffer, res.byteLength) // key
          res = encode(entry[1], res.buffer, res.byteLength) // value
        }
        return res
      }
    case 'boolean':
      return copyByte(data ? Types.True : Types.False, buffer, offset)
    case 'number': {
      return encodeNumber(data, buffer, offset)
    }
    case 'string': {
      return encodeString(Types.Utf8String, data, buffer, offset)
    }
    case 'function': {
      return encodeString(Types.Utf8Function, data.toString(), buffer, offset)
    }
    case 'symbol': {
      const key = Symbol.keyFor(data)
      if (key === undefined) {
        console.error('unknown symbol key:', data)
        throw new Error('symbol key not found')
      }
      return encodeString(Types.Utf8Symbol, key, buffer, offset)
    }
    case 'bigint':
      byteLength = offset + 1 + 8
      buffer = ensureBufferSize(buffer, byteLength)
      if (data >= 0) {
        buffer[offset] = Types.BigUInt64BE
        buffer.writeBigUInt64BE(data, offset + 1)
      } else {
        buffer[offset] = Types.BigInt64BE
        buffer.writeBigInt64BE(data, offset + 1)
      }
      return { buffer, byteLength }
  }
  console.error('unknown data type:', data)
  throw new Error('unknown data type')
}
