import {
  ensureRealtimeRuntimeStarted,
  subscribeToRealtimePayloads,
} from "@/server/realtime-runtime.mjs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const encoder = new TextEncoder()

function encodeSseChunk(payload: unknown) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
}

export async function GET(request: Request) {
  await ensureRealtimeRuntimeStarted()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      let heartbeatId: ReturnType<typeof setInterval> | null = null
      let unsubscribe = () => {}

      const cleanup = () => {
        if (closed) return
        closed = true

        unsubscribe()

        if (heartbeatId) {
          clearInterval(heartbeatId)
          heartbeatId = null
        }

        try {
          controller.close()
        } catch {
          // stream already closed
        }
      }

      controller.enqueue(encoder.encode("retry: 1500\n\n"))

      unsubscribe = subscribeToRealtimePayloads((payload: unknown) => {
        if (closed) return

        try {
          controller.enqueue(encodeSseChunk(payload))
        } catch {
          cleanup()
        }
      })

      heartbeatId = setInterval(() => {
        if (closed) return

        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"))
        } catch {
          cleanup()
        }
      }, 15_000)

      request.signal.addEventListener("abort", cleanup, { once: true })
    },
  })

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  })
}
