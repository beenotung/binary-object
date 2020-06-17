import { BinaryJsonFileSink } from '../src'
import { iterateSamples, sampleCount } from './sample'

const file = 'db.log'

// const sink = BinaryObjectFileSink.fromFile(file)
// const sink = new SchemaSink(new BinaryObjectSink(FileSink.fromFile(file)))
const sink = BinaryJsonFileSink.fromFile(file)
// const sink = new SchemaSink(new BinaryJsonSink(FileSink.fromFile(file)))
// const sink = new MsgpackSink(FileSink.fromFile(file))
// const sink = new SchemaSink(new MsgpackSink(FileSink.fromFile(file)))

const n = sampleCount
let i = 0
console.log({ n })
for (const { key, value } of iterateSamples()) {
  i++
  sink.write(key)
  sink.write(value)
  if (Math.random() < 1 / 1000) {
    console.log(i, '/', n)
  }
}
sink.close()
