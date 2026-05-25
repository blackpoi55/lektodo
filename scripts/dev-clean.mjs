import { execFileSync } from 'node:child_process'

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function run(args) {
  try {
    execFileSync(npmCmd, args, {
      stdio: 'inherit',
    })
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
        ? error.status
        : 1
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exit(status)
  }
}

run(['run', 'kill:dev'])
run(['run', 'clean:next'])
run(['run', 'dev'])
