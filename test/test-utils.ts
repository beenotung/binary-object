import { assert } from 'chai'
import { Sink, Source } from '../src'
import { getTypeName } from './utils'

console.log = jest.fn()

export function testEncode(sink: Sink<any>, typeName: string, sample: any) {
  it('should encode ' + typeName, function () {
    console.log('encode', typeName, sample)
    sink.write(sample)
  })
}

export function testDecode(source: Source<any>, typeName: string, sample: any) {
  it('should decode ' + typeName, function () {
    console.log('decode', typeName)
    let data = source.read()
    if (typeof sample === 'function') {
      data = data.toString()
      sample = sample.toString()
    }
    assert.deepEqual(data, sample, `failed on type: ${typeName}`)
  })
}

export function testSuit(
  samples: any[],
  sinkF: () => Sink<any>,
  sourceF: () => Source<any>,
) {
  {
    const sink = sinkF()
    for (const [type, sample] of samples) {
      const typeName = getTypeName(type)
      testEncode(sink, typeName, sample)
    }
    testEncode(sink, 'all samples', samples)
  }
  {
    const source = sourceF()
    for (const [type, sample] of samples) {
      const typeName = getTypeName(type)
      testDecode(source, typeName, sample)
    }
    testDecode(source, 'all samples', samples)
  }
}
