import { assert } from 'chai'
import { decode, encode } from './binary-file'
import { samples } from './sample-object'
import { getTypeName } from './utils'

function test(type: number, sample: any) {
  const typeName = getTypeName(type)
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
    test(type, sample)
  }
})
