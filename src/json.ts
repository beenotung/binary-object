import { Sink, Source } from './pipe'

export class JsonSink extends Sink<any> {
  constructor(public sink: Sink<string>) {
    super()
  }

  write(data: any) {
    this.sink.write(JSON.stringify(data))
  }

  close() {
    this.sink.close()
  }
}

export class JsonSource extends Source<any> {
  constructor(public source: Source<string>) {
    super()
  }

  read(): any {
    const data = this.source.read()
    return JSON.parse(data)
  }

  *iterator(options?: { autoClose?: boolean }): Generator<any> {
    for (const data of this.source.iterator(options)) {
      yield JSON.parse(data)
    }
  }

  close() {
    this.source.close()
  }
}
