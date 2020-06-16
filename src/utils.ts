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
  UInt64BE: 12,
  FloatBE: 13,
  DoubleBE: 14,
  Utf8String: 15,
  Utf8Function: 16,
  Utf8Symbol: 17,
  DateUInt64BE: 18,
  Map: 19,
  Set: 20,
  Buffer: 21,
  Array: 22,
  Object: 23,
}

/**
 * int16:  2
 * int32:  4
 * int64:  8
 * float:  4
 * double: 8
 * */
const numberBuffer = Buffer.alloc(8)
