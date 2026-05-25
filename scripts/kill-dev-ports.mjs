import { execFileSync } from 'node:child_process'

const ports = process.argv
  .slice(2)
  .map((value) => Number.parseInt(value, 10))
  .filter((value) => Number.isInteger(value) && value > 0)

if (ports.length === 0) {
  console.error('No ports provided.')
  process.exit(1)
}

function listPidsForWindowsPort(port) {
  const output = execFileSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' })
  const pids = new Set()

  for (const line of output.split(/\r?\n/)) {
    const cols = line.trim().split(/\s+/)
    if (cols.length < 5 || cols[0] !== 'TCP') continue

    const localAddress = cols[1]
    const pid = Number.parseInt(cols[4], 10)
    const localPort = Number.parseInt(localAddress.split(':').at(-1) ?? '', 10)

    if (localPort === port && Number.isInteger(pid) && pid > 0) {
      pids.add(pid)
    }
  }

  return [...pids]
}

function listPidsForUnixPort(port) {
  try {
    const output = execFileSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf8' })
    return output
      .split(/\r?\n/)
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value) && value > 0)
  } catch {
    return []
  }
}

function killPid(pid) {
  if (process.platform === 'win32') {
    execFileSync('taskkill', ['/PID', String(pid), '/F'], { stdio: 'ignore' })
    return
  }

  process.kill(pid, 'SIGKILL')
}

const allPids = new Set()

for (const port of ports) {
  const pids =
    process.platform === 'win32' ? listPidsForWindowsPort(port) : listPidsForUnixPort(port)

  for (const pid of pids) allPids.add(pid)
}

if (allPids.size === 0) {
  console.log(`No user processes found on ports ${ports.join(', ')}.`)
  process.exit(0)
}

for (const pid of allPids) {
  try {
    killPid(pid)
    console.log(`Stopped PID ${pid}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.log(`Failed to stop PID ${pid}: ${message}`)
  }
}
