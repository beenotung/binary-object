import {
  ContinuousCompressJsonSink,
  ContinuousCompressJsonSource,
} from '../src/continuous-compress-json'
import { LineFileSink, LineFileSource } from '../src/line-file'
import { jsonSample } from './sample-object'
import { testSuit } from './test-utils'

const file = 'db.log'
describe('continuous-compress-json TestSuit', () => {
  testSuit(
    jsonSample,
    () => new ContinuousCompressJsonSink(LineFileSink.fromFile(file)),
    () => new ContinuousCompressJsonSource(LineFileSource.fromFile(file)),
  )
})
