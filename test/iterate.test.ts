import { assert } from 'chai'
import debug from 'debug'
import { BinaryFileSink, iterateBinaryFile } from '../src/binary-file'
import { samples } from './sample-object'

const log = debug('test:iterator')

describe('Binary File Iterator TestSuit', () => {
  const file = 'log'

  it('should prepare data', function (done) {
    const sink = BinaryFileSink.fromFile(file)
    for (const sample of samples) {
      log('write', sample)
      sink.write(sample[1])
    }
    log('close')
    sink.close()
    log('closed')
    done()
  })

  it('should iterate all samples', function () {
    let i = 0
    for (let data of iterateBinaryFile(file)) {
      let sample = samples[i]?.[1]
      log('read', { i, sample, data })
      if (typeof sample === 'function') {
        data = data.toString()
        sample = sample.toString()
      }
      assert.deepEqual(data, sample)
      i++
      // log('next', samples[i])
    }
    assert.equal(i, samples.length)
  })
})
