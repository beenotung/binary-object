/**
 * in-memory channel to mock IO
 * */

import { Sink, Source } from './pipe'

export class ArraySink extends Sink<any> {
  constructor(public memory: any[]) {
    super()
  }

  write(data: any) {
    this.memory.push(data)
  }

  close() {
    delete this.memory
  }
}

/**
 * in-memory channel to mock IO
 * */
export class ArraySource extends Source<any> {
  position = 0

  constructor(public memory: any[]) {
    super()
  }

  read(): any {
    return this.memory[this.position++]
  }

  *iterator(options?: { autoClose?: boolean }): Generator<any> {
    for (const data of this.memory) {
      yield data
    }
  }

  close() {
    delete this.memory
  }
}
