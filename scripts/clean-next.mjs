import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

const nextPath = resolve('.next')

try {
  rmSync(nextPath, { recursive: true, force: true })
  console.log(`Removed ${nextPath}`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Failed to remove ${nextPath}: ${message}`)
  process.exit(1)
}
