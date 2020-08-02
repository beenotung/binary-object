import { FileSink, FileSource } from '../src'
import { MsgpackSink, MsgpackSource } from '../src/msgpack'
import { jsonSample } from './sample-object'
import { testSuit } from './test-utils'

const file = 'db.log'
describe('msgpack TestSuit', () => {
  testSuit(
    jsonSample,
    () => new MsgpackSink(FileSink.fromFile(file)),
    () => new MsgpackSource(FileSource.fromFile(file)),
  )
})
