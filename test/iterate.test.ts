import { assert } from 'chai'
import { BinaryFileSink, iterateBinaryFile } from '../src/binary-file'
import { samples } from './sample-object'

describe('Binary File Iterator TestSuit', () => {
  const file = 'log'

  it('should prepare data', function(done) {
    const sink = BinaryFileSink.fromFile(file)
    for (const sample of samples) {
      console.log('write', sample)
      sink.write(sample[1])
    }
    console.log('close')
    sink.close()
    console.log('closed')
    done()
  })

  it('should iterate all samples', function() {
    let i = 0
    for (let data of iterateBinaryFile(file)) {
      let sample = samples[i]?.[1]
      console.log('read', { i, sample, data })
      if (typeof sample === 'function') {
        data = data.toString()
        sample = sample.toString()
      }
      assert.deepEqual(data, sample)
      i++
      // console.log('next', samples[i])
    }
    assert.equal(i, samples.length)
  })
})
