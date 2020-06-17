import { BinaryObjectSink, BinaryObjectSource } from './binary-object'
import { FileSink, FileSource } from './file'

export namespace BinaryObjectFileSink {
  export function fromFile(file: string, flags?: string) {
    const binarySink = FileSink.fromFile(file, flags)
    return new BinaryObjectSink(binarySink)
  }
}

export namespace BinaryObjectFileSource {
  export function fromFile(file: string, flags?: string) {
    const binarySource = FileSource.fromFile(file, flags)
    return new BinaryObjectSource(binarySource)
  }
}
