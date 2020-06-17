import { BinaryObjectSink, BinaryObjectSource, End } from './binary-object'
import { FileSink, FileSource } from './file'
import { Sink, Source } from './pipe'

export class BinaryFileSink extends Sink<any> {
  constructor(public sink: BinaryObjectSink) {
    super()
  }

  write(data: any) {
    this.sink.write(data)
  }

  close() {
    this.sink.write(End)
    this.sink.close()
  }

  static fromFile(file: string, flags?: string) {
    const fileSink = FileSink.fromFile(file, flags)
    const binaryObjectSink = new BinaryObjectSink(fileSink)
    return new BinaryFileSink(binaryObjectSink)
  }
}

export class BinaryFileSource extends Source<any> {
  constructor(public source: Source<any>) {
    super()
  }

  read(): any {
    return this.source.read()
  }
  close() {
    this.source.close()
  }

  static fromFile(file: string, flags?: string) {
    const fileSource = FileSource.fromFile(file, flags)
    const binaryObjectSource = new BinaryObjectSource(fileSource)
    return new BinaryFileSource(binaryObjectSource)
  }
}

export function* iterateBinaryFile(file: string) {
  const source = BinaryFileSource.fromFile(file)
  for (;;) {
    const data = source.read()
    if (data === End) {
      return
    }
    yield data
  }
}
