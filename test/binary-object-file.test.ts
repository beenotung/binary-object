import { assert } from 'chai'
import { decode, encode } from './binary-object-file'
import { samples } from './sample-object'
import { getTypeName } from './utils'

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

describe('Binary Object TestSuit', function () {
  for (const [type, sample] of samples) {
    const typeName = getTypeName(type)
    test(typeName, sample)
  }
  test(
    'all samples',
    samples.map(sample => sample[1]).filter(x => typeof x !== 'function'),
  )
})
