type Node = {
  line: string
  key: number
  prev?: Node
  next?: Node
}

function toList(node: Node) {
  const acc = []
  while (node) {
    acc.push(node.line)
    node = node.next!
  }
  return acc
}

function toString(node: Node) {
  return JSON.stringify(toList(node), null, 2)
}

export function newCache({
  maxSize,
  drop,
}: {
  maxSize: number
  drop: (key: number) => void
}) {
  // head is less used, tail is more used
  let head: Node | undefined
  // line -> Node
  const nodes: Record<string, Node> = {}
  let usedSize = 0
  let nextKey = 0

  function addLine(line: string): { key: number; new: boolean } {
    if (line in nodes) {
      const node = nodes[line]
      more(node)
      return { key: node.key, new: false }
    }
    const key = nextKey
    nextKey++
    add(line, key)
    return { key, new: true }
  }

  // prev, node, next, tail -> prev, next, node, tail
  function more(node: Node) {
    if (!node.next) { return }
    const { prev, next } = node
    const tail = next.next
    if (head == node) {
      head = next
    }
    if (prev) {
      prev.next = next
    }
    next.prev = prev
    next.next = node
    node.prev = next
    node.next = tail
  }

  function add(line: string, key: number) {
    const itemSize = line.length
    if (itemSize >= maxSize) {
      return
    }
    if (!head) {
      head = { line, key }
      nodes[line] = head
      usedSize += itemSize
      return
    }
    const spaceNeeded = maxSize - itemSize
    while (usedSize > spaceNeeded && head) {
      drop(head.key)
      delete nodes[head.line]
      usedSize -= head.line.length
      head = head.next
    }
    const node: Node = {
      line,
      key,
    }
    if (head) {
      node.next = head
      head.prev = node
    }
    head = node
    usedSize += itemSize
    nodes[line] = head
  }

  return { addLine }
}
