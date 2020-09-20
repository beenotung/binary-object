import { UniqueValueSink } from '../src'
import { RawLineFileSink } from '../src/raw-line-file'
import { iterateSamples, sampleCount } from './sample'

const file = 'db.log'

// const sink = new JsonSink(RawLineFileSink.fromFile(file))
// const sink = BinaryObjectFileSink.fromFile(file)
// const sink = new SchemaSink(new BinaryObjectSink(FileSink.fromFile(file)))
// const sink = BinaryJsonFileSink.fromFile(file)
// const sink = new SchemaSink(new BinaryJsonSink(FileSink.fromFile(file)))
// const sink = new MsgpackSink(FileSink.fromFile(file))
// const sink = new SchemaSink(new MsgpackSink(FileSink.fromFile(file)))
// const sink = new SchemaSink(new JsonSink(LineFileSink.fromFile(file)))
// const sink = new SchemaSink(new CompressJsonSink(LineFileSink.fromFile(file)))
// const sink = new ContinuousCompressJsonSink(RawLineFileSink.fromFile(file))
const sink = new UniqueValueSink(RawLineFileSink.fromFile(file))

const n = sampleCount / 2
let i = 0
console.log({ n })
for (const { key, value } of iterateSamples()) {
  i++
  sink.write(key)
  sink.write(value)
  if (Math.random() < 1 / 1000) {
    console.log(i, '/', n)
  }
  if (i >= n) {
    break
  }
}
sink.close()
