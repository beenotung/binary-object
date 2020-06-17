import { FileSink, FileSource } from '../src'
import { BinaryJsonSink, BinaryJsonSource } from './binary-json'

/**
 * only support JSON values
 * e.g. don't support Buffer, Map, Set and Date
 *
 * This is much faster than BinaryObjectSink, but that support full set of javascript objects
 * */
export namespace BinaryJsonFileSink {
  export function fromFile(file: string, flags?: string) {
    const binarySink = FileSink.fromFile(file, flags)
    return new BinaryJsonSink(binarySink)
  }
}

/**
 * only support JSON values
 * e.g. don't support Buffer, Map, Set and Date
 *
 * This is much faster than BinaryObjectSource, but that support full set of javascript objects
 * */
export namespace BinaryJsonFileSource {
  export function fromFile(file: string, flags?: string) {
    const binarySource = FileSource.fromFile(file, flags)
    return new BinaryJsonSource(binarySource)
  }
}
