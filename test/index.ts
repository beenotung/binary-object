import { decode, encode } from '../src/binary'

function match(data: any, result: any): boolean {
  if (typeof data === 'bigint') {
    return data === result
  }
  if (Array.isArray(data)) {
    return (
      Array.isArray(result) && data.every((data, i) => match(data, result[i]))
    )
  }
  const dataStr = JSON.stringify(data)
  const resultStr = JSON.stringify(result)
  return dataStr === resultStr
}

export function test() {
  const samples = [
    undefined,
    null,
    true,
    false,
    BigInt(5),
    BigInt(-5),
    0,
    -5,
    NaN,
    1 / 0,
    65,
    270,
    65540,
    Date.now(),
    1.5,
    Math.PI,
    'str',
    function foo() {
      return 'bar'
    },
    Symbol.for('sym'),
    new Date(),
    new Map([['foo', 'bar']]),
    new Set(['foo', 'bar']),
    Buffer.from('bin'),
    [42, 'ans'],
    [{ foo: 'bar' }],
    [42, 'ans', { foo: 'bar' }],
    { foo: 'bar' },
  ]

  function test(data: any) {
    console.log()
    console.log('data:', data)

    const res = encode(data)
    console.log('len:', res.byteLength)
    console.log('bin:', res.buffer.slice(0, res.byteLength))

    const result = decode(res.buffer, res.byteLength)
    console.log('result:', result)

    let isMatch = match(data, result)
    console.log('match:', isMatch)
    if (!isMatch) {
      throw new Error('not match')
    }
  }

  for (const sample of samples) {
    test(sample)
  }
  // test(samples)
}

test()
