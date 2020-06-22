import {
  CompressJsonFileSink,
  CompressJsonFileSource,
} from '../src/compress-json-file'
import { jsonSample } from './sample-object'
import { testSuit } from './test-utils'

const file = 'db.log'
describe('compress-json-file TestSuit', () => {
  testSuit(
    jsonSample,
    () => CompressJsonFileSink.fromFile(file),
    () => CompressJsonFileSource.fromFile(file),
  )
})
