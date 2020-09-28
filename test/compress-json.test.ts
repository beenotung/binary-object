import { assert } from 'chai'
import { FileSink, FileSource, SchemaSink, SchemaSource } from '../src'
import {
  BinaryCompressJsonSink,
  BinaryCompressJsonSource,
} from '../src/binary-compress-json'
import { iterateSamples, sampleCount } from './sample'

const file = 'db.log'

describe('compress-json TestSuit', () => {
  it('should encode all samples', function () {
    const sink = new SchemaSink(
      new BinaryCompressJsonSink(FileSink.fromFile(file)),
    )
    let i = 0
    for (const { key, value } of iterateSamples()) {
      i++
      sink.write(key)
      sink.write(value)
      if (Math.random() < 1 / 1000) {
        console.log(i, '/', sampleCount)
      }
    }
    sink.close()
  })
  it('should decode all samples', function () {
    const source = new SchemaSource(
      new BinaryCompressJsonSource(FileSource.fromFile(file)),
    )
    let i = 0
    for (const sample of iterateSamples()) {
      i++
      const key = source.read()
      const value = source.read()
      const data = { key, value }
      assert.deepEqual(data, sample)
      if (Math.random() < 1 / 1000) {
        console.log(i, '/', sampleCount)
      }
    }
    source.close()
  })
})
