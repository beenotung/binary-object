import { assert } from 'chai'
import { SchemaSink, SchemaSource } from '../src'
import { ArraySink, ArraySource } from './array-pipe'
import { samples } from './sample-object'
import { getTypeName } from './utils'

describe('schema TestSuit', () => {
  const memory: any[] = []

  {
    const arraySink = new ArraySink(memory)
    const schemaSink = new SchemaSink(arraySink)

    for (let sample of samples) {
      const typeName = getTypeName(sample[0])
      sample = sample[1]
      it('should encode ' + typeName, function () {
        schemaSink.write(sample)
      })
    }
    // schemaSink.close()
  }

  {
    const arraySource = new ArraySource(memory)
    const schemaSource = new SchemaSource(arraySource)
    for (let sample of samples) {
      const typeName = getTypeName(sample[0])
      sample = sample[1]
      it('should decode ' + typeName, function () {
        // console.log('sample', sample)
        let data = schemaSource.read()
        if (typeof sample === 'function') {
          data = data.toString()
          sample = (sample as any).toString()
        }
        assert.deepEqual(data, sample, `failed to decode ${typeName}`)
      })
    }
    // schemaSource.close()
  }
})
