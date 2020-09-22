type Node = {
  line: string
  key: number
  prev?: Node
  next?: Node
}

export function newCache({ maxSize }: { maxSize: number }) {
  // head is less used
  let head: Node | undefined
  // line -> node
  const nodes = new Map<string, Node>()
  let cacheSize = 0
  let nextKey = 0

  function addLine(line: string): { key: number; new: boolean } {
    if (nodes.has(line)) {
      const node = nodes.get(line)!
      more(node)
      return { key: node.key, new: false }
    }
    const key = nextKey
    nextKey++
    add(line, key)
    return { key, new: true }
  }

  function more(node: Node) {
    const { prev, next } = node
    // prev, node, next -> prev, next, node
    if (prev) {
      prev.next = next
    }
    if (next) {
      next.prev = prev
      next.next = node
    }
    node.prev = next
  }

  function replace(node: Node, line: string, key: number) {
    cacheSize = cacheSize - node.line.length + line.length
    nodes.delete(node.line)
    nodes.set(line, node)
    node.line = line
    node.key = key
  }

  function add(line: string, key: number) {
    const itemSize = line.length
    if (itemSize > maxSize) {
      return
    }
    if (head) {
      replace(head, line, key)
      return
    }
    cacheSize += itemSize
    head = { line, key }
    nodes.set(line, head)
  }

  return { addLine }
}
