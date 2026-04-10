export type Mode = "sports" | "esports"
export type Source = "sports" | "esports"
export type GameState = "idle" | "armed" | "guess-locked" | "resolved"
export type ConnectionState = "connecting" | "connected" | "disconnected"
export type VideoLoadState = "idle" | "loading" | "ready" | "error"
export type StreamKind = "empty" | "video" | "youtube" | "twitch" | "unsupported"
export type FeedStatus = "LIVE" | "REPLAY" | "SCHEDULED" | "FINAL"
export type EventType = string

export interface LiveEvent {
  id: string
  source: Source
  matchId: string
  title: string
  competition: string
  eventType: EventType
  eventTimestamp: number
  label: string
  team: string
  streamStatus: FeedStatus
}

export interface FeedState {
  source: Source
  matchId: string
  title: string
  competition: string
  venue: string
  clockMs: number
  startedAt: number
  streamStatus: FeedStatus
  streamUrl: string
  streamSyncSupported: boolean
  posterUrl: string
  statusDetail: string
  broadcastName: string | null
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  isPlayable: boolean
  eventCount: number
}

export interface LeaderboardEntry {
  rank: number
  player: string
  score: number
}

export interface EventLog {
  id: string
  matchId: string
  title: string
  type: string
  team: string
  time: string
  source: Source
}

export interface RoundResult {
  eventId: string
  eventLabel: string
  eventType: string
  clickMs: number | null
  actualMs: number
  deltaMs: number | null
  score: number
  verdict: string
}

export interface ParsedStreamSource {
  kind: StreamKind
  originalUrl: string
  playableUrl: string | null
  syncSupported: boolean
  label: string
  reason?: string
}
