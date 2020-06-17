import { assert } from 'chai'
import { SchemaFileSink, SchemaFileSource } from '../src'
import { samples } from './sample-object'
import { getTypeName } from './utils'

const file = 'log'

export function encode(data: any) {
  const sink = SchemaFileSink.fromFile(file)
  sink.write(data)
  sink.close()
}

export function decode() {
  const source = SchemaFileSource.fromFile(file)
  const data = source.read()
  source.close()
  return data
}

function test(typeName: string, sample: any) {
  it('should encode ' + typeName, function () {
    encode(sample)
  })
  it('should decode ' + typeName, function () {
    let data = decode()
    if (typeof sample === 'function') {
      data = data.toString()
      sample = sample.toString()
    }
    assert.deepEqual(data, sample, `failed on type: ${typeName}`)
  })
}

describe('Binary File TestSuit', function () {
  for (const [type, sample] of samples) {
    const typeName = getTypeName(type)
    test(typeName, sample)
  }
  test(
    'all samples',
    samples.map(sample => sample[1]).filter(x => typeof x !== 'function'),
  )
})
