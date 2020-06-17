import { Sink, Source } from './pipe'

export class CallbackSink<T> extends Sink<T> {
  constructor(
    public onData: (data: T) => void,
    public onComplete?: () => void,
  ) {
    super()
  }

  write(data: any) {
    this.onData(data)
  }

  close() {
    this.onComplete?.()
  }
}

export class CallbackSource<T> extends Source<T> {
  constructor(public producer: () => T, public onClose?: () => void) {
    super()
  }

  read(): any {
    return this.producer()
  }

  close() {
    this.onClose?.()
  }
}
