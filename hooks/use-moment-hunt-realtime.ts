"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MutableRefObject } from "react"
import {
  formatClockFromMs,
  normalizeTypeLabel,
} from "@/lib/moment-hunt/format"
import type {
  ConnectionState,
  EventLog,
  FeedState,
  GameState,
  LiveEvent,
  Mode,
} from "@/lib/moment-hunt/types"

interface UseMomentHuntRealtimeOptions {
  activeMatchIdRef: MutableRefObject<string | null>
  gameStateRef: MutableRefObject<GameState>
  modeRef: MutableRefObject<Mode>
  onRelevantEvent?: (event: LiveEvent) => void
  wsUrl: string
}

export function useMomentHuntRealtime({
  activeMatchIdRef,
  gameStateRef,
  modeRef,
  onRelevantEvent,
  wsUrl,
}: UseMomentHuntRealtimeOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting")
  const [feedsByMatch, setFeedsByMatch] = useState<Record<string, FeedState>>({})
  const [eventLog, setEventLog] = useState<EventLog[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectEnabledRef = useRef(true)

  const connect = useCallback(() => {
    reconnectEnabledRef.current = true
    wsRef.current?.close()
    setConnectionState("connecting")

    const socket = new WebSocket(wsUrl)
    wsRef.current = socket

    socket.onopen = () => {
      setConnectionState("connected")
    }

    socket.onclose = () => {
      setConnectionState("disconnected")
      window.setTimeout(() => {
        if (reconnectEnabledRef.current && wsRef.current === socket) connect()
      }, 1500)
    }

    socket.onerror = () => {
      setConnectionState("disconnected")
    }

    socket.onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data)

        if (payload.type === "feed_state") {
          const data = payload.data as FeedState
          setFeedsByMatch((prev) => ({ ...prev, [data.matchId]: data }))
          return
        }

        if (payload.type === "live_event") {
          const data = payload.data as LiveEvent
          setEventLog((prev) => [
            {
              id: data.id,
              matchId: data.matchId,
              title: data.title,
              type: normalizeTypeLabel(data.eventType),
              team: data.team,
              time: formatClockFromMs(data.eventTimestamp),
              source: data.source,
            },
            ...prev,
          ].slice(0, 40))

          if (data.source !== modeRef.current || data.matchId !== activeMatchIdRef.current) {
            return
          }

          if (gameStateRef.current === "armed" || gameStateRef.current === "guess-locked") {
            onRelevantEvent?.(data)
          }
        }
      } catch {
        // ignore malformed messages
      }
    }
  }, [activeMatchIdRef, gameStateRef, modeRef, onRelevantEvent, wsUrl])

  useEffect(() => {
    connect()
    return () => {
      reconnectEnabledRef.current = false
      wsRef.current?.close()
    }
  }, [connect])

  const clearEventLog = useCallback(() => {
    setEventLog([])
  }, [])

  return {
    clearEventLog,
    connect,
    connectionState,
    eventLog,
    feedsByMatch,
  }
}
