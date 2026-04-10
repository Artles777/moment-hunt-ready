import {
  BlobPreconditionFailedError,
  get,
  put,
} from "@vercel/blob"
import {
  addLeaderboardScore,
  DEFAULT_LEADERBOARD,
  ensureLeaderboardPlayer,
  formatPlayerLabel,
  normalizeLeaderboard,
  resetLeaderboardPlayer,
} from "@/lib/moment-hunt/scoring"
import type { LeaderboardEntry } from "@/lib/moment-hunt/types"

const LEADERBOARD_BLOB_PATH = "moment-hunt/leaderboard.json"
const LEADERBOARD_BLOB_ACCESS = "private"
const LEADERBOARD_WRITE_RETRIES = 4

interface StoredLeaderboardPayload {
  entries: LeaderboardEntry[]
  updatedAt: string
  version: 1
}

interface StoredLeaderboardSnapshot {
  entries: LeaderboardEntry[]
  etag: string | null
}

function buildStoredPayload(entries: LeaderboardEntry[]): StoredLeaderboardPayload {
  return {
    entries,
    updatedAt: new Date().toISOString(),
    version: 1,
  }
}

function normalizeStoredEntries(value: unknown) {
  if (!Array.isArray(value)) {
    return DEFAULT_LEADERBOARD
  }

  const entries = value.flatMap((entry): LeaderboardEntry[] => {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof entry.id !== "string" ||
      typeof entry.player !== "string" ||
      typeof entry.score !== "number"
    ) {
      return []
    }

    return [
      {
        id: entry.id,
        player: entry.player,
        score: entry.score,
        rank: 0,
      },
    ]
  })

  return entries.length > 0 ? normalizeLeaderboard(entries) : DEFAULT_LEADERBOARD
}

function areEntriesEqual(left: LeaderboardEntry[], right: LeaderboardEntry[]) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((entry, index) => {
    const other = right[index]

    return (
      entry.id === other?.id &&
      entry.player === other?.player &&
      entry.rank === other?.rank &&
      entry.score === other?.score
    )
  })
}

async function readLeaderboardSnapshot(): Promise<StoredLeaderboardSnapshot> {
  const blob = await get(LEADERBOARD_BLOB_PATH, {
    access: LEADERBOARD_BLOB_ACCESS,
    useCache: false,
  })

  if (!blob || blob.statusCode !== 200) {
    return {
      entries: DEFAULT_LEADERBOARD,
      etag: null,
    }
  }

  const text = await new Response(blob.stream).text()

  try {
    const parsed = JSON.parse(text) as Partial<StoredLeaderboardPayload>

    return {
      entries: normalizeStoredEntries(parsed.entries),
      etag: blob.blob.etag,
    }
  } catch {
    return {
      entries: DEFAULT_LEADERBOARD,
      etag: blob.blob.etag,
    }
  }
}

async function writeLeaderboard(entries: LeaderboardEntry[], etag: string | null) {
  return put(
    LEADERBOARD_BLOB_PATH,
    JSON.stringify(buildStoredPayload(entries)),
    {
      access: LEADERBOARD_BLOB_ACCESS,
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json; charset=utf-8",
      ...(etag ? { ifMatch: etag } : {}),
    },
  )
}

async function mutateLeaderboard(
  mutator: (current: LeaderboardEntry[]) => LeaderboardEntry[],
): Promise<LeaderboardEntry[]> {
  for (let attempt = 0; attempt < LEADERBOARD_WRITE_RETRIES; attempt += 1) {
    const snapshot = await readLeaderboardSnapshot()
    const nextEntries = normalizeLeaderboard(mutator(snapshot.entries))

    if (areEntriesEqual(snapshot.entries, nextEntries)) {
      return nextEntries
    }

    try {
      await writeLeaderboard(nextEntries, snapshot.etag)
      return nextEntries
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) {
        continue
      }

      throw error
    }
  }

  throw new Error("Leaderboard update conflicted too many times")
}

export async function loadLeaderboard(playerId: string) {
  return mutateLeaderboard((current) => ensureLeaderboardPlayer(current, playerId))
}

export async function addScore(playerId: string, scoreDelta: number) {
  return mutateLeaderboard((current) => addLeaderboardScore(current, playerId, scoreDelta))
}

export async function resetScore(playerId: string) {
  return mutateLeaderboard((current) => resetLeaderboardPlayer(current, playerId))
}

export function getPlayerLabel(playerId: string) {
  return formatPlayerLabel(playerId)
}
