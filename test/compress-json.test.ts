import { CompressJsonSink, CompressJsonSource } from '../src/compress-json'
import { LineFileSink, LineFileSource } from '../src/line-file'
import { jsonSample } from './sample-object'
import { testSuit } from './test-utils'

const file = 'db.log'
describe('compress-json TestSuit', () => {
  testSuit(
    jsonSample,
    () => new CompressJsonSink(LineFileSink.fromFile(file)),
    () => new CompressJsonSource(LineFileSource.fromFile(file)),
  )
})
