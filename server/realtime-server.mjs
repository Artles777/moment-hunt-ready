import { WebSocketServer } from 'ws'
import {
  ensureRealtimeRuntimeStarted,
  subscribeToRealtimePayloads,
} from './realtime-runtime.mjs'

const port = Number(process.env.WS_PORT || 3001)

await ensureRealtimeRuntimeStarted()

const wss = new WebSocketServer({ port })

console.log(`[moment-hunt] websocket server listening on ws://localhost:${port}`)

wss.on('connection', (socket) => {
  const unsubscribe = subscribeToRealtimePayloads((payload) => {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(payload))
    }
  })

  socket.on('close', unsubscribe)
  socket.on('error', unsubscribe)
})
