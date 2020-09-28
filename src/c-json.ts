import { compress, decompress } from 'compress-json'
import { iterateSamples, sampleCount } from '../test/sample'
import { BinaryJsonFileSink, BinaryJsonFileSource } from './binary-json-file'
import { Sink, Source } from './pipe'

export class CJsonSink extends Sink<any> {
  constructor(public sink: Sink<any>) {
    super()
  }

  write(data: any) {
    this.sink.write(compress(data))
  }

  close() {
    this.sink.close()
  }
}

export class CJsonSource extends Source<any> {
  constructor(public source: Source<any>) {
    super()
  }

  read(): any {
    return decompress(this.source.read())
  }

  *iterator(options?: { autoClose?: boolean }): Generator<any> {
    for (const data of this.source.iterator(options)) {
      yield decompress(data)
    }
  }

  close() {
    this.source.close()
  }
}

export function testSink() {
  const sink = new CJsonSink(BinaryJsonFileSink.fromFile('db.log'))
  let i = 0
  for (const { key, value } of iterateSamples()) {
    i++
    if (Math.random() < 1 / 1000) {
      console.log(i, '/', sampleCount)
    }
    sink.write(key)
    sink.write(value)
  }
  sink.close()
  console.log('done write')
}

export function testSource() {
  const source = new CJsonSource(BinaryJsonFileSource.fromFile('db.log'))
  let i = 0
  console.log({ n: sampleCount })
  for (const data of source.iterator({ autoClose: true })) {
    i++
    if (Math.random() < 1 / 1000) {
      console.log(i / 2, '/', sampleCount)
    }
    // console.log(data)
  }
  console.log('done')
}

export function test() {
  testSource()
}

test()
