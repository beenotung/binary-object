
import { CacheSink, CacheSource } from '../src/cache'
import { RawLineFileSink, RawLineFileSource } from '../src/raw-line-file'
import { jsonSample } from './sample-object'
import { testSuit } from './test-utils'

const file = 'db.log'
describe('Cache Pipe TestSuit', () => {
  testSuit(
    jsonSample,
    () =>
      new CacheSink(RawLineFileSink.fromFile(file), {
        shouldCache: () => true,
      }),
    () => new CacheSource(RawLineFileSource.fromFile(file)),
  )
})
