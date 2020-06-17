import fs from 'fs'

const file = 'res/sample.txt'

const Type = {
  Key: 1,
  Value: 2,
}

export function* iterateSamples() {
  let mode = Type.Key
  let key: string = ''
  let value: any
  for (const string of fs
    .readFileSync(file)
    .toString()
    .split('\n')
    .filter(s => s)) {
    switch (mode) {
      case Type.Key:
        key = JSON.parse(string)
        mode = Type.Value
        continue
      case Type.Value:
        value = JSON.parse(string)
        yield { key, value }
        mode = Type.Key
        continue
    }
  }
}

export function countSamples() {
  return (
    fs
      .readFileSync(file)
      .toString()
      .split('\n')
      .filter(s => s).length / 2
  )
}

export let sampleCount = 266430
