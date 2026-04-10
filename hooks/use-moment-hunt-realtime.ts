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
  FeedSnapshot,
  GameState,
  LiveEvent,
  Mode,
} from "@/lib/moment-hunt/types"

interface UseMomentHuntRealtimeOptions {
  activeMatchIdRef: MutableRefObject<string | null>
  gameStateRef: MutableRefObject<GameState>
  modeRef: MutableRefObject<Mode>
  onRelevantEvent?: (event: LiveEvent) => void
  wsUrl?: string
  sseUrl?: string
}

export function useMomentHuntRealtime({
  activeMatchIdRef,
  gameStateRef,
  modeRef,
  onRelevantEvent,
  wsUrl,
  sseUrl = "/api/realtime",
}: UseMomentHuntRealtimeOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting")
  const [feedsByMatch, setFeedsByMatch] = useState<Record<string, FeedState>>({})
  const [eventLog, setEventLog] = useState<EventLog[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectEnabledRef = useRef(true)

  const handlePayload = useCallback((rawPayload: string) => {
    try {
      const payload = JSON.parse(rawPayload) as {
        data?: FeedState | FeedSnapshot | LiveEvent
        type?: string
      }

      if (payload.type === "feed_state") {
        const data = payload.data as FeedState
        setFeedsByMatch((prev) => ({ ...prev, [data.matchId]: data }))
        return
      }

      if (payload.type === "feed_snapshot") {
        const data = payload.data as FeedSnapshot
        const matchIdSet = new Set(data.matchIds)

        setFeedsByMatch((prev) =>
          Object.fromEntries(
            Object.entries(prev).filter(([, feed]) =>
              feed.source !== data.source || matchIdSet.has(feed.matchId),
            ),
          ),
        )
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
  }, [activeMatchIdRef, gameStateRef, modeRef, onRelevantEvent])

  const connect = useCallback(() => {
    reconnectEnabledRef.current = true
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    const previousSocket = wsRef.current
    const previousEventSource = eventSourceRef.current
    wsRef.current = null
    eventSourceRef.current = null
    previousSocket?.close()
    previousEventSource?.close()
    setConnectionState("connecting")

    if (wsUrl) {
      const socket = new WebSocket(wsUrl)
      wsRef.current = socket

      socket.onopen = () => {
        setConnectionState("connected")
      }

      socket.onclose = () => {
        if (wsRef.current !== socket) {
          return
        }

        wsRef.current = null
        setConnectionState("disconnected")
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (reconnectEnabledRef.current && wsRef.current === null) {
            connect()
          }
        }, 1500)
      }

      socket.onerror = () => {
        if (wsRef.current === socket) {
          setConnectionState("disconnected")
        }
      }

      socket.onmessage = (message) => {
        handlePayload(message.data)
      }

      return
    }

    const source = new EventSource(sseUrl)
    eventSourceRef.current = source

    source.onopen = () => {
      if (eventSourceRef.current === source) {
        setConnectionState("connected")
      }
    }

    source.onerror = () => {
      if (eventSourceRef.current !== source) {
        return
      }

      setConnectionState(
        source.readyState === EventSource.CLOSED ? "disconnected" : "connecting",
      )
    }

    source.onmessage = (message) => {
      handlePayload(message.data)
    }
  }, [handlePayload, sseUrl, wsUrl])

  useEffect(() => {
    connect()
    return () => {
      reconnectEnabledRef.current = false
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      wsRef.current?.close()
      eventSourceRef.current?.close()
      wsRef.current = null
      eventSourceRef.current = null
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
