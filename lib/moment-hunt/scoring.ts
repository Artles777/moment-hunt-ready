import type { LeaderboardEntry } from "@/lib/moment-hunt/types"

export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, player: "ProGamer99", score: 320 },
  { rank: 2, player: "SportsWiz", score: 280 },
  { rank: 3, player: "TimingKing", score: 240 },
  { rank: 4, player: "You", score: 0 },
  { rank: 5, player: "NewPlayer", score: 0 },
]

export const STORAGE_KEY = "moment-hunt-leaderboard-v2"

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

export function upsertLeaderboard(current: LeaderboardEntry[], addScore: number) {
  const updated = current.map((item) =>
    item.player === "You" ? { ...item, score: item.score + addScore } : item,
  )

  return updated
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}
