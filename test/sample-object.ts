import { Types } from '../src/binary-object'

// [type, sample data]
type Sample = [number, any]
export let samples: Sample[] = [
  [Types.Undefined, undefined],
  [Types.Null, null],
  [Types.True, true],
  [Types.False, false],
  [Types.BigInt64BE, BigInt(5)],
  [Types.BigInt64BE, BigInt(-5)],
  [Types.Zero, 0],
  [Types.Negative, -5],
  [Types.NaN, Number.NaN],
  [Types.Infinity, 1 / 0],
  [Types.Byte, 42],
  [Types.UInt16BE, 272],
  [Types.UInt32BE, 65560],
  [Types.UInt64BE, Date.now()],
  [Types.FloatBE, 1.5],
  [Types.DoubleBE, Math.PI],
  [Types.BinaryString, 'str'],
  [
    Types.Utf8Function,
    function test() {
      return 123
    },
  ],
  [Types.Utf8Symbol, Symbol.for('sym')],
  [Types.DateUInt64BE, new Date()],
  [Types.Map, new Map([[42, 'val']])],
  [Types.Set, new Set([42])],
  [Types.Buffer, Buffer.from([65, 66, 67])],
  [Types.Array, [42, 'ans']],
  [Types.Object, { key: 'val' }],
]

export let jsonSample = samples.filter(sample => {
  const data = sample[1]
  switch (typeof data) {
    case 'undefined':
    case 'function':
    case 'symbol':
    case 'bigint':
      return false
    case 'number':
      if (Number.isNaN(data) || !Number.isFinite(data)) {
        return false
      }
      if (data < 0) {
        return false // FIXME
      }
      break
    case 'object':
      if (
        data instanceof Map ||
        data instanceof Set ||
        data instanceof Date ||
        Buffer.isBuffer(data)
      ) {
        return false
      }
  }
  return true
})
