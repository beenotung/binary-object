import { BinaryFileSink, BinaryFileSource } from '../src/binary-file'

const file = 'log'

export function encode(data: any) {
  const sink = BinaryFileSink.fromFile(file)
  sink.write(data)
  sink.close()
}

export function decode() {
  const source = BinaryFileSource.fromFile(file)
  const data = source.read()
  source.close()
  return data
}

export function test(sample: any) {
  encode(sample)
  console.log(decode())
}

test(Math.PI)
