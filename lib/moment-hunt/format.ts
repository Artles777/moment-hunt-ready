import type { EventType, FeedState } from "@/lib/moment-hunt/types"

export function formatClockFromMs(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function getClockLabel(feed: FeedState | null) {
  if (!feed) return "Feed Time"
  if (feed.streamStatus === "REPLAY") {
    return feed.source === "esports" ? "Replay Time" : "Replay Clock"
  }

  return "Match Time"
}

export function getClockHint(feed: FeedState | null) {
  if (!feed) return ""
  if (feed.source === "esports") {
    return "Simulated demo timeline"
  }

  if (feed.streamStatus === "REPLAY") {
    return "Loops after the full match clock"
  }

  return feed.statusDetail
}

export function normalizeTypeLabel(type: EventType) {
  return type.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase())
}
