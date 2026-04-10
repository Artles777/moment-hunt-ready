import type { LeaderboardEntry } from "@/lib/moment-hunt/types"

export const PLAYER_COOKIE_NAME = "moment-hunt-player-id"

const DEFAULT_LEADERBOARD_SEED: LeaderboardEntry[] = [
  { id: "bot-progamer99", rank: 0, player: "ProGamer99", score: 320 },
  { id: "bot-sportswiz", rank: 0, player: "SportsWiz", score: 280 },
  { id: "bot-timingking", rank: 0, player: "TimingKing", score: 240 },
  { id: "bot-newplayer", rank: 0, player: "NewPlayer", score: 0 },
]

const PLAYER_ID_PATTERN = /^[a-f0-9-]{16,64}$/i

const SCORING_BANDS = [
  { maxDeltaSeconds: 3, score: 100, verdict: "Perfect" },
  { maxDeltaSeconds: 10, score: 60, verdict: "Close" },
  { maxDeltaSeconds: 20, score: 30, verdict: "Almost" },
  { maxDeltaSeconds: 60, score: 10, verdict: "Near" },
] as const

export function getScore(deltaMs: number | null) {
  if (deltaMs === null) return { score: 0, verdict: "Missed" }

  const deltaSeconds = deltaMs / 1000

  for (const band of SCORING_BANDS) {
    if (deltaSeconds <= band.maxDeltaSeconds) {
      return { score: band.score, verdict: band.verdict }
    }
  }

  return { score: 0, verdict: "Missed" }
}

export function isValidPlayerId(value: string | null | undefined): value is string {
  return typeof value === "string" && PLAYER_ID_PATTERN.test(value)
}

export function formatPlayerLabel(playerId: string) {
  const compactId = playerId.replaceAll("-", "").slice(0, 8).toUpperCase()
  return `Hunter-${compactId}`
}

function rankLeaderboard(current: LeaderboardEntry[]) {
  return [...current]
    .sort((a, b) => b.score - a.score || a.player.localeCompare(b.player) || a.id.localeCompare(b.id))
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

function createPlayerEntry(playerId: string, score = 0): LeaderboardEntry {
  return {
    id: playerId,
    rank: 0,
    player: formatPlayerLabel(playerId),
    score,
  }
}

export const DEFAULT_LEADERBOARD = rankLeaderboard(DEFAULT_LEADERBOARD_SEED)

export function normalizeLeaderboard(current: LeaderboardEntry[]) {
  return rankLeaderboard(
    current.map((entry) => ({
      ...entry,
      player: entry.id.startsWith("bot-") ? entry.player : formatPlayerLabel(entry.id),
    })),
  )
}

export function ensureLeaderboardPlayer(current: LeaderboardEntry[], playerId: string) {
  if (current.some((entry) => entry.id === playerId)) {
    return normalizeLeaderboard(current)
  }

  return normalizeLeaderboard([...current, createPlayerEntry(playerId)])
}

export function addLeaderboardScore(
  current: LeaderboardEntry[],
  playerId: string,
  addScore: number,
) {
  const withPlayer = ensureLeaderboardPlayer(current, playerId)

  return normalizeLeaderboard(
    withPlayer.map((entry) =>
      entry.id === playerId ? { ...entry, score: entry.score + addScore } : entry,
    ),
  )
}

export function resetLeaderboardPlayer(current: LeaderboardEntry[], playerId: string) {
  const withPlayer = ensureLeaderboardPlayer(current, playerId)

  return normalizeLeaderboard(
    withPlayer.map((entry) =>
      entry.id === playerId ? { ...entry, score: 0 } : entry,
    ),
  )
}
