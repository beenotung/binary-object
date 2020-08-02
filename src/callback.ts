export interface CallbackSource<T> {
  read(cb: (data: T) => void): void

  close(): void

  iterator(): AsyncGenerator<T>
}

export class StoppableCallbackSource<T> {
  stopped = false

  constructor(
    public source: {
      read: (cb: (data: T) => void) => void
      close?: () => void
    },
  ) {}

  read(cb: (data: T) => void) {
    this.source.read(cb)
  }

  close() {
    this.stopped = true
    this.source.close?.()
  }

  async *iterator(): AsyncGenerator<T> {
    for (;;) {
      if (this.stopped) {
        break
      }
      yield new Promise<T>(resolve => this.read(resolve))
    }
  }
}
