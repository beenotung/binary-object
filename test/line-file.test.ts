import { JsonSink, JsonSource } from '../src/json'
import { LineFileSink, LineFileSource } from '../src/line-file'
import { jsonSample } from './sample-object'
import { testSuit } from './test-utils'

const file = 'db.log'
describe('line-file TestSuit', () => {
  testSuit(
    jsonSample,
    () => new JsonSink(LineFileSink.fromFile(file)),
    () => new JsonSource(LineFileSource.fromFile(file)),
  )
})
