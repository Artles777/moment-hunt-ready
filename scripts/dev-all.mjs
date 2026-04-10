import { spawn } from 'node:child_process'

const env = { ...process.env }

const ws = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev:ws'], {
  stdio: 'inherit',
  env,
})

const app = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev:next'], {
  stdio: 'inherit',
  env,
})

const shutdown = () => {
  ws.kill('SIGTERM')
  app.kill('SIGTERM')
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
