import { decode as decode_helper } from './decode'
import { BufferResult } from './encode'
import { encode as encode_helper } from './encode'

let _pool = Buffer.alloc(1)

export function clearPool() {
  _pool = Buffer.alloc(1)
}

export function encode(data: any, pool = _pool): BufferResult {
  const res = encode_helper(data, pool, 0)
  _pool = res.buffer
  return res
}

export function decode(
  buffer: Buffer,
  byteLength: number = buffer.length,
): any {
  if (buffer.length > _pool.length) {
    _pool = buffer
  }
  return decode_helper(buffer, byteLength)
}
