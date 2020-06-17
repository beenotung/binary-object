import {
  BinaryObjectFileSink,
  BinaryObjectFileSource,
} from '../src/binary-object-file'

const file = 'log'

export function encode(data: any) {
  const sink = BinaryObjectFileSink.fromFile(file)
  sink.write(data)
  sink.close()
}

export function decode() {
  const source = BinaryObjectFileSource.fromFile(file)
  const data = source.read()
  source.close()
  return data
}

export function test(sample: any) {
  encode(sample)
  console.log(decode())
}

// test(Math.PI)
// test(Buffer.from([1, 2, 3]))
// test([1, 2, 3])
// test({ key: 'val' })
