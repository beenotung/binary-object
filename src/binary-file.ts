import { BinaryObjectSink, BinaryObjectSource, Types } from './binary-object'
import { FileSink, FileSource } from './file'
import { Sink, Source } from './pipe'

export class BinaryFileSink extends Sink<any> {
  constructor(public sink: Sink<any>) {
    super()
  }

  write(data: any) {
    this.sink.write(data)
  }

  close() {
    this.sink.write(Types.End)
    this.sink.close()
    super.close()
  }

  static fromFile(file: string) {
    const fileSink = FileSink.fromFile(file)
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

  static fromFile(file: string) {
    const fileSource = FileSource.fromFile(file)
    const binaryObjectSource = new BinaryObjectSource(fileSource)
    return new BinaryFileSource(binaryObjectSource)
  }
}
