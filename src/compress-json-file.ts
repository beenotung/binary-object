import { CompressJsonSink, CompressJsonSource } from './compress-json'
import { LineFileSink, LineFileSource } from './line-file'

export namespace CompressJsonFileSink {
  export function fromFile(file: string, flags?: string) {
    const stringSink = LineFileSink.fromFile(file, flags)
    return new CompressJsonSink(stringSink)
  }
}

export namespace CompressJsonFileSource {
  export function fromFile(file: string, flags?: string) {
    const stringSource = LineFileSource.fromFile(file, flags)
    return new CompressJsonSource(stringSource)
  }
}
