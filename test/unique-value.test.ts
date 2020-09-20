import { UniqueValueSink, UniqueValueSource } from '../src'
import { LineFileSink, LineFileSource } from '../src/line-file'
import { jsonSample } from './sample-object'
import { testSuit } from './test-utils'

const file = 'db.log'
describe('unique-value TestSuit', () => {
  testSuit(
    jsonSample,
    () => new UniqueValueSink(LineFileSink.fromFile(file)),
    () => new UniqueValueSource(LineFileSource.fromFile(file)),
  )
})
