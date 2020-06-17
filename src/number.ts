export function fraction(data: number): [number, number] {
  if (data < 0) {
    const res = fraction(data)
    res[0] = -res[0]
    return res
  }
  let a = 1
  let b = 1
  for (;;) {
    const x = a / b
    if (x === data) {
      return [a, b]
    }
    if (x > data) {
      b++
    } else {
      a++
    }
  }
}
