import { startTimer } from '@beenotung/tslib/node'
import { RawLineFileSink } from '../src/raw-line-file'
import { LimitedUniqueValueSink } from '../src/unique-value'
import { iterateSamples, sampleCount } from './sample'

const file = 'db.log'

// const sink = new JsonSink(RawLineFileSink.fromFile(file))
// const sink = BinaryObjectFileSink.fromFile(file)
// const sink = new SchemaSink(new BinaryObjectSink(FileSink.fromFile(file)))
// const sink = BinaryJsonFileSink.fromFile(file)
// const sink = new SchemaSink(new BinaryJsonSink(FileSink.fromFile(file)))
// const sink = new MsgpackSink(FileSink.fromFile(file))
// const sink = new SchemaSink(new MsgpackSink(FileSink.fromFile(file)))
// const sink = new SchemaSink(new CompressJsonSink(LineFileSink.fromFile(file)))
// const sink = new ContinuousCompressJsonSink(RawLineFileSink.fromFile(file))
// const sink = new SchemaSink(new JsonSink(RawLineFileSink.fromFile(file)))
// const sink = new UniqueValueSink(RawLineFileSink.fromFile(file))
// const sink = new SchemaSink(new UniqueValueSink(RawLineFileSink.fromFile(file)))
const sink = new LimitedUniqueValueSink(
  { maxSize: 8 * 1024 },
  RawLineFileSink.fromFile(file),
)
// const sink = new SchemaSink(
//   new LimitedUniqueValueSink({ maxSize: 64 * 1024 ** 2 },
//       RawLineFileSink.fromFile(file)))

// const n = sampleCount / 2
const n = sampleCount
// const n = 15000
// const n = 1500
let i = 0
console.log({ n })
const timer = startTimer('export sample data')
timer.setProgress({ totalTick: n, sampleOver: 1000, estimateTime: true })
for (const { key, value } of iterateSamples()) {
  i++
  sink.write(key)
  sink.write(value)
  timer.tick()
  if (i >= n) {
    break
  }
}
sink.close()
timer.end()
