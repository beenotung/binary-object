import { fraction } from '../src/number'

function encode(data: number): any {
  return fraction(data)
}

function decode([a, b]: any): number {
  return a / b
}

const sample = Math.PI
console.log('sample :', sample)

const bin = encode(sample)
console.log('   bin :', bin)

const data = decode(bin)
console.log('  data :', data)

console.log(' match :', sample === data)
