import { NextResponse } from "next/server"
import {
  isValidPlayerId,
  PLAYER_COOKIE_NAME,
} from "@/lib/moment-hunt/scoring"
import type { LeaderboardResponse } from "@/lib/moment-hunt/types"
import {
  addScore,
  getPlayerLabel,
  loadLeaderboard,
  resetScore,
} from "@/server/leaderboard-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function resolvePlayerId(request: Request): {
  playerId: string
  shouldSetCookie: boolean
} {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const playerCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PLAYER_COOKIE_NAME}=`))

  const cookieValue = playerCookie?.slice(PLAYER_COOKIE_NAME.length + 1) ?? null

  if (isValidPlayerId(cookieValue)) {
    return {
      playerId: cookieValue,
      shouldSetCookie: false,
    }
  }

  return {
    playerId: crypto.randomUUID(),
    shouldSetCookie: true,
  }
}

function withPlayerCookie(
  response: NextResponse<LeaderboardResponse>,
  playerId: string,
  shouldSetCookie: boolean,
) {
  if (!shouldSetCookie) {
    return response
  }

  response.cookies.set({
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    name: PLAYER_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    value: playerId,
  })

  return response
}

async function buildLeaderboardResponse(
  request: Request,
  action: (playerId: string) => Promise<LeaderboardResponse["entries"]>,
) {
  const { playerId, shouldSetCookie } = resolvePlayerId(request)
  const entries = await action(playerId)

  const response = NextResponse.json<LeaderboardResponse>({
    entries,
    playerId,
    playerLabel: getPlayerLabel(playerId),
  })

  return withPlayerCookie(response, playerId, shouldSetCookie)
}

export async function GET(request: Request) {
  try {
    return await buildLeaderboardResponse(request, loadLeaderboard)
  } catch (error) {
    console.error("[moment-hunt] failed to load leaderboard", error)
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { scoreDelta?: unknown } | null
    const scoreDelta = Number(body?.scoreDelta)

    if (!Number.isFinite(scoreDelta) || scoreDelta <= 0) {
      return NextResponse.json({ error: "scoreDelta must be a positive number" }, { status: 400 })
    }

    return await buildLeaderboardResponse(request, (playerId) =>
      addScore(playerId, Math.round(scoreDelta)),
    )
  } catch (error) {
    console.error("[moment-hunt] failed to update leaderboard", error)
    return NextResponse.json({ error: "Failed to update leaderboard" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    return await buildLeaderboardResponse(request, resetScore)
  } catch (error) {
    console.error("[moment-hunt] failed to reset leaderboard player", error)
    return NextResponse.json({ error: "Failed to reset leaderboard player" }, { status: 500 })
  }
}
