import { genBase } from './base'

export let { int_to_str, str_to_int } = genBase([
  { start: 48, count: 10 },
  { start: 65, count: 26 },
  { start: 65 + 32, count: 26 },
])
