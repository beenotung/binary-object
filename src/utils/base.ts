export function genBase(ranges: Array<{ start: number; count: number }>) {
  let base = 0
  const numbers: any = {}
  for (const { start, count } of ranges) {
    for (let i = 0; i < count; i++) {
      const s = String.fromCharCode(start + i)
      numbers[base] = s
      numbers[s] = base
      base++
    }
  }

  /** only support positive integer */
  function int_to_str(int: number): string {
    if (int === 0) {
      return '0'
    }
    const acc: string[] = []
    while (int !== 0) {
      const c = int % base
      acc.push(numbers[c])
      int = (int - c) / base
    }
    return acc.reverse().join('')
  }

  /** only support positive integer */
  function str_to_int(str: string): number {
    let acc = 0
    const n = str.length
    for (let i = 0; i < n; i++) {
      const c = str[i]
      acc = acc * base + numbers[c]
    }
    return acc
  }

  return { int_to_str, str_to_int }
}
