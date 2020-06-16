import fs from 'fs'

const Type = {
  Key: 1,
  Value: 2,
}

export function* iterateSamples() {
  let mode = Type.Key
  let key: string = ''
  let value: any
  for (const string of fs.readFileSync('res/sample.txt').toString().split('\n')) {
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
