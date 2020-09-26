import { SchemaSource, UniqueValueSource } from '../src'
import { RawLineFileSource } from '../src/raw-line-file'
import { sampleCount } from './sample'

const file = 'db.log'

// const source = new JsonSource(RawLineFileSource.fromFile(file))
// const source = BinaryJsonFileSource.fromFile(file)
// const source = new SchemaSource(new BinaryJsonSource(FileSource.fromFile(file)))
// const source = new SchemaSource(new MsgpackSource(FileSource.fromFile(file)))
// const source = new ContinuousCompressJsonSource(LineFileSource.fromFile(file))
// const source = new SchemaSource(new JsonSource(RawLineFileSource.fromFile(file)))
// const source = new UniqueValueSource(RawLineFileSource.fromFile(file))
const source = new SchemaSource(
  new UniqueValueSource(RawLineFileSource.fromFile(file)),
)

const n = sampleCount
let i = 0
let key: string = ''
for (const data of source.iterator()) {
  i++
  if (i % 2 === 1) {
    key = data
    continue
  }
  if (!'dev') {
    console.dir({ key, value: data }, { depth: 20 })
  }
  if (Math.random() < 1 / 1000) {
    console.log(i / 2, '/', n)
  }
}
console.log('done')
