function parseEventBlock(block) {
  const data = block
    .split(/\r?\n/)
    .filter(line => line.startsWith('data:'))
    .map(line => line.slice(5).trimStart())
    .join('\n')

  if (!data || data === '[DONE]') return null

  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function createSseParser(onEvent) {
  let buffer = ''

  const emitCompleteBlocks = () => {
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() || ''
    for (const block of blocks) {
      const event = parseEventBlock(block)
      if (event) onEvent(event)
    }
  }

  return {
    push(chunk) {
      buffer += chunk
      emitCompleteBlocks()
    },
    finish() {
      const event = parseEventBlock(buffer)
      buffer = ''
      if (event) onEvent(event)
    },
  }
}

