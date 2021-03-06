export abstract class Sink<T> {
  abstract write(data: T): void

  writeBatch(data: T[]): void {
    for (const datum of data) {
      this.write(datum)
    }
  }

  abstract close(): void
}

export abstract class Source<T> {
  abstract read(): T

  readBatch(n: number): T[] {
    const res = new Array<T>(n)
    for (let i = 0; i < n; i++) {
      res[i] = this.read()
    }
    return res
  }

  abstract close(): void

  abstract iterator(options?: { autoClose?: boolean }): Generator<T>
}
