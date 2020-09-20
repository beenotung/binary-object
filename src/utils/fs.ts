import fs from 'fs'

const LineFeed = 10
const DefaultBufferSize = 8 * 1024 * 1024

export type IterateFdByLineOptions = {
  encoding?: BufferEncoding
  batchSize?: number
}

export function* iterateFdByLine(
  fd: number,
  options?: IterateFdByLineOptions,
): Generator<string> {
  const batchSize = options?.batchSize || DefaultBufferSize
  const encoding = options?.encoding
  const readBuffer = Buffer.alloc(batchSize)
  let acc = Buffer.alloc(0)
  for (;;) {
    const read = fs.readSync(fd, readBuffer, 0, batchSize, null)
    if (read === 0) {
      break
    }
    acc = Buffer.concat([acc, readBuffer], acc.length + read)
    for (;;) {
      const idx = acc.indexOf(LineFeed)
      if (idx === -1) {
        break
      }
      const line = acc.slice(0, idx)
      yield line.toString(encoding)
      acc = acc.slice(idx + 1)
    }
  }
  if (acc.length > 0) {
    yield acc.toString(encoding)
  }
}
