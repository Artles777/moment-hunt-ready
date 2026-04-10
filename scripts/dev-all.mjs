import { spawn } from 'node:child_process'

const env = { ...process.env }
const appEnv = {
  ...env,
  NEXT_PUBLIC_WS_URL: env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
}

const ws = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev:ws'], {
  stdio: 'inherit',
  env,
})

const app = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev:next'], {
  stdio: 'inherit',
  env: appEnv,
})

const shutdown = () => {
  ws.kill('SIGTERM')
  app.kill('SIGTERM')
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
