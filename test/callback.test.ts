import { expect } from 'chai'
import { StoppableCallbackSource } from '../src/callback'

describe('StoppableCallback TestSuit', () => {
  class TickSource extends StoppableCallbackSource<number> {
    i = 0

    constructor() {
      super({
        read: cb => setTimeout(() => cb(this.i++), 200),
      })
    }
  }

  it('should be able to iterate', async () => {
    const source = new TickSource()
    setTimeout(() => source.close(), 1000)
    const numbers: number[] = []
    for await (const number of source.iterator()) {
      console.log('num:', number)
      numbers.push(number)
    }
    expect(numbers).deep.equals([0, 1, 2, 3, 4])
  })
})
