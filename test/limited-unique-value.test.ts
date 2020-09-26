import { UniqueValueSource } from '../src'
import { RawLineFileSink, RawLineFileSource } from '../src/raw-line-file'
import { LimitedUniqueValueSink } from '../src/unique-value'
import { jsonSample } from './sample-object'
import { testSuit } from './test-utils'
// import { Types } from '../src/binary-object'

const file = 'db.log'
describe('unique-value TestSuit', () => {
  testSuit(
    jsonSample,
    // [
    //   [Types.BinaryString,'Hello'],
    //   [Types.Array,['Hello']],
    // ],
    () =>
      new LimitedUniqueValueSink(
        { maxSize: 8 * 1024 ** 2 },
        RawLineFileSink.fromFile(file),
      ),
    () => new UniqueValueSource(RawLineFileSource.fromFile(file)),
  )
})
