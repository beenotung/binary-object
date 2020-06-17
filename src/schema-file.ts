
import { BinaryFileSink, BinaryFileSource } from './binary-file'
import { End } from './binary-object'
import { SchemaSink, SchemaSource } from './schema'

export namespace SchemaFileSink {
  export function fromFrom(file: string, flags?: string) {
    const binaryObjectSink = BinaryFileSink.fromFile(file, flags)
    const schemaSink = new SchemaSink(binaryObjectSink)
    // return new SchemaFileSink(schemaSink)
    return schemaSink
  }
}

export namespace SchemaFileSource {
  export function fromFrom(file: string, flags?: string) {
    const binaryFileSource = BinaryFileSource.fromFile(file, flags)
    const schemaSource = new SchemaSource(binaryFileSource)
    // return new SchemaFileSource(schemaSource)
    return schemaSource
  }
}
export function* iterateSchemaFile(file: string) {
  const source = BinaryFileSource.fromFile(file)
  for (;;) {
    const data = source.read()
    if (data === End) {
      return
    }
    yield data
  }
}
