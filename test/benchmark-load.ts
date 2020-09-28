import { FileSource, SchemaSource } from '../src'
import { BinaryCompressJsonSource } from '../src/binary-compress-json'
import { sampleCount } from './sample'

const file = 'db.log'

// const source = BinaryJsonFileSource.fromFile(file)
// const source = new SchemaSource(new BinaryJsonSource(FileSource.fromFile(file)))
const source = new SchemaSource(
  new BinaryCompressJsonSource(FileSource.fromFile(file)),
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
    console.log({ key, value: data })
  }
  if (Math.random() < 1 / 1000) {
    console.log(i / 2, '/', n)
  }
}
console.log('done')
