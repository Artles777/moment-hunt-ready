"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BroadcastList } from "@/components/moment-hunt/broadcast-list"
import { GamePanel } from "@/components/moment-hunt/game-panel"
import { PageHeader } from "@/components/moment-hunt/page-header"
import { RightRail } from "@/components/moment-hunt/right-rail"
import { VideoHero } from "@/components/moment-hunt/video-hero"
import { useMomentHuntRealtime } from "@/hooks/use-moment-hunt-realtime"
import {
  DEFAULT_LEADERBOARD,
  getScore,
} from "@/lib/moment-hunt/scoring"
import {
  getClockHint,
  getClockLabel,
  normalizeTypeLabel,
} from "@/lib/moment-hunt/format"
import { parseStreamSource } from "@/lib/moment-hunt/stream-source"
import type {
  FeedState,
  FeedStatus,
  GameState,
  LeaderboardEntry,
  LeaderboardResponse,
  LiveEvent,
  Mode,
  RoundResult,
  VideoLoadState,
} from "@/lib/moment-hunt/types"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL

const FEED_STATUS_ORDER: Record<FeedStatus, number> = {
  LIVE: 0,
  REPLAY: 1,
  SCHEDULED: 2,
  FINAL: 3,
}

export default function MomentHuntPage() {
  const [mode, setMode] = useState<Mode>("sports")
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD)
  const [gameState, setGameState] = useState<GameState>("idle")
  const [targetEvent, setTargetEvent] = useState<LiveEvent | null>(null)
  const [guessMs, setGuessMs] = useState<number | null>(null)
  const [result, setResult] = useState<RoundResult | null>(null)
  const [resolvedEventIds, setResolvedEventIds] = useState<string[]>([])
  const [videoStateByMatch, setVideoStateByMatch] = useState<Record<string, VideoLoadState>>({})
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [embedParentHost, setEmbedParentHost] = useState("localhost")
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const modeRef = useRef(mode)
  const gameStateRef = useRef(gameState)
  const activeMatchIdRef = useRef<string | null>(null)

  const handleRelevantEvent = useCallback((data: LiveEvent) => {
    setTargetEvent((currentTarget) => currentTarget ?? data)
  }, [])

  const {
    clearEventLog,
    connect,
    connectionState,
    eventLog,
    feedsByMatch,
  } = useMomentHuntRealtime({
    activeMatchIdRef,
    gameStateRef,
    modeRef,
    onRelevantEvent: handleRelevantEvent,
    wsUrl: WS_URL,
  })

  const currentStreams = useMemo(
    () =>
      Object.values(feedsByMatch)
        .filter((feed) => feed.source === mode)
        .sort((left, right) => {
          const leftStreamSource = parseStreamSource(
            left.streamUrl,
            embedParentHost,
            left.streamSyncSupported,
          )
          const rightStreamSource = parseStreamSource(
            right.streamUrl,
            embedParentHost,
            right.streamSyncSupported,
          )
          const leftHasPlayableVideo =
            leftStreamSource.kind !== "empty" &&
            leftStreamSource.kind !== "unsupported" &&
            !!leftStreamSource.playableUrl
          const rightHasPlayableVideo =
            rightStreamSource.kind !== "empty" &&
            rightStreamSource.kind !== "unsupported" &&
            !!rightStreamSource.playableUrl

          const byPlayableVideo = Number(rightHasPlayableVideo) - Number(leftHasPlayableVideo)
          if (byPlayableVideo !== 0) return byPlayableVideo

          const byStatus = FEED_STATUS_ORDER[left.streamStatus] - FEED_STATUS_ORDER[right.streamStatus]
          if (byStatus !== 0) return byStatus

          const byPlayability = Number(right.isPlayable) - Number(left.isPlayable)
          if (byPlayability !== 0) return byPlayability

          return left.title.localeCompare(right.title)
        }),
    [embedParentHost, feedsByMatch, mode],
  )
  const selectedFeed = useMemo(
    () => currentStreams.find((feed) => feed.matchId === selectedMatchId) ?? null,
    [currentStreams, selectedMatchId],
  )
  const currentFeed = useMemo(() => {
    if (selectedFeed) {
      return selectedFeed
    }

    return currentStreams[0] ?? null
  }, [currentStreams, selectedFeed])
  const currentStreamSource = useMemo(
    () =>
      parseStreamSource(
        currentFeed?.streamUrl ?? "",
        embedParentHost,
        currentFeed?.streamSyncSupported,
      ),
    [currentFeed?.streamSyncSupported, currentFeed?.streamUrl, embedParentHost],
  )
  const currentVideoState =
    !currentFeed
      ? "idle"
      : videoStateByMatch[currentFeed.matchId] ??
        (currentStreamSource.kind === "empty"
          ? "idle"
          : currentStreamSource.kind === "unsupported"
            ? "error"
            : "loading")
  const yourScore = useMemo(
    () => leaderboard.find((entry) => entry.id === currentPlayerId)?.score ?? 0,
    [currentPlayerId, leaderboard],
  )

  const applyLeaderboardResponse = useCallback((payload: LeaderboardResponse) => {
    setLeaderboard(payload.entries)
    setCurrentPlayerId(payload.playerId)
  }, [])

  const syncLeaderboard = useCallback(
    async (options?: { method?: "DELETE" | "GET" | "POST"; scoreDelta?: number }) => {
      const response = await fetch("/api/leaderboard", {
        body:
          options?.method === "POST"
            ? JSON.stringify({ scoreDelta: options.scoreDelta })
            : undefined,
        cache: "no-store",
        headers:
          options?.method === "POST"
            ? { "Content-Type": "application/json" }
            : undefined,
        method: options?.method ?? "GET",
      })

      if (!response.ok) {
        throw new Error(`Leaderboard request failed: ${response.status}`)
      }

      const payload = (await response.json()) as LeaderboardResponse
      applyLeaderboardResponse(payload)
      return payload
    },
    [applyLeaderboardResponse],
  )

  useEffect(() => {
    void syncLeaderboard().catch((error) => {
      console.error("[moment-hunt] failed to fetch leaderboard", error)
    })
  }, [syncLeaderboard])

  useEffect(() => {
    setEmbedParentHost(window.location.hostname || "localhost")
  }, [])

  useEffect(() => {
    if (currentStreams.length === 0) {
      setSelectedMatchId(null)
      return
    }

    if (!currentFeed) {
      setSelectedMatchId(currentStreams[0].matchId)
      return
    }

    if (selectedMatchId !== currentFeed.matchId) {
      setSelectedMatchId(currentFeed.matchId)
    }
  }, [currentFeed, currentStreams, selectedMatchId])

  useEffect(() => {
    activeMatchIdRef.current = currentFeed?.matchId ?? null
  }, [currentFeed?.matchId])

  useEffect(() => {
    setGameState("idle")
    setTargetEvent(null)
    setGuessMs(null)
    setResult(null)
    setResolvedEventIds([])
  }, [currentFeed?.matchId])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    if (!currentFeed?.matchId) return

    setVideoStateByMatch((prev) => ({
      ...prev,
      [currentFeed.matchId]:
        currentStreamSource.kind === "empty"
          ? "idle"
          : currentStreamSource.kind === "unsupported"
            ? "error"
            : "loading",
    }))
  }, [currentFeed?.matchId, currentFeed?.streamUrl, currentStreamSource.kind])

  const syncVideoToFeed = useCallback(() => {
    const video = videoRef.current
    if (
      !video ||
      !currentFeed ||
      currentStreamSource.kind !== "video" ||
      !currentStreamSource.playableUrl ||
      !currentStreamSource.syncSupported
    ) {
      return
    }

    video.muted = isVideoMuted

    const targetSeconds = currentFeed.clockMs / 1000
    if (!Number.isFinite(targetSeconds)) return

    const hasDuration = Number.isFinite(video.duration) && video.duration > 0
    const boundedTarget = hasDuration
      ? Math.min(targetSeconds, Math.max(video.duration - 0.35, 0))
      : targetSeconds

    if (Math.abs(video.currentTime - boundedTarget) > 1.25) {
      try {
        video.currentTime = boundedTarget
      } catch {
        // ignore seek issues while metadata is still loading
      }
    }

    const playAttempt = video.play()
    if (playAttempt) {
      playAttempt.catch(() => {
        // keep UI responsive even if autoplay is blocked
      })
    }
  }, [currentFeed, currentStreamSource, isVideoMuted])

  useEffect(() => {
    if (currentVideoState !== "ready" || !currentStreamSource.syncSupported) return
    syncVideoToFeed()
  }, [currentFeed?.clockMs, currentFeed?.startedAt, currentVideoState, currentStreamSource.syncSupported, syncVideoToFeed])

  useEffect(() => {
    if (!targetEvent || resolvedEventIds.includes(targetEvent.id)) return
    if (gameState !== "armed" && gameState !== "guess-locked") return

    const deltaMs = guessMs === null ? null : Math.abs(guessMs - targetEvent.eventTimestamp)
    const { score, verdict } = getScore(deltaMs)

    const nextResult: RoundResult = {
      eventId: targetEvent.id,
      eventLabel: targetEvent.label,
      eventType: normalizeTypeLabel(targetEvent.eventType),
      clickMs: guessMs,
      actualMs: targetEvent.eventTimestamp,
      deltaMs,
      score,
      verdict,
    }

    setResult(nextResult)
    setGameState("resolved")
    setResolvedEventIds((prev) => [...prev, targetEvent.id])

    if (score > 0) {
      void syncLeaderboard({ method: "POST", scoreDelta: score }).catch((error) => {
        console.error("[moment-hunt] failed to persist score", error)
      })
    }
  }, [gameState, guessMs, resolvedEventIds, syncLeaderboard, targetEvent])

  const handleArmRound = () => {
    setGameState("armed")
    setTargetEvent(null)
    setGuessMs(null)
    setResult(null)
  }

  const handleCatch = () => {
    if (!currentFeed || gameState !== "armed") return
    setGuessMs(currentFeed.clockMs)
    setGameState("guess-locked")
  }

  const handleResetSession = async () => {
    setGameState("idle")
    setTargetEvent(null)
    setGuessMs(null)
    setResult(null)
    setResolvedEventIds([])
    clearEventLog()

    try {
      await syncLeaderboard({ method: "DELETE" })
    } catch (error) {
      console.error("[moment-hunt] failed to reset player score", error)
    }
  }

  const handleSelectBroadcast = (feed: FeedState) => {
    setMode(feed.source)
    setSelectedMatchId(feed.matchId)
  }

  const handleToggleVideoMute = () => {
    const nextMuted = !isVideoMuted
    setIsVideoMuted(nextMuted)

    const activeVideo = videoRef.current

    if (activeVideo) {
      activeVideo.muted = nextMuted
      if (!nextMuted) {
        const playAttempt = activeVideo.play()
        if (playAttempt) {
          playAttempt.catch(() => {
            const latestVideo = videoRef.current
            if (latestVideo) {
              latestVideo.muted = true
            }
            setIsVideoMuted(true)
          })
        }
      }
    }
  }

  const handleVideoReady = () => {
    if (!currentFeed?.matchId) return
    setVideoStateByMatch((prev) => ({ ...prev, [currentFeed.matchId]: "ready" }))
    if (currentStreamSource.syncSupported) {
      syncVideoToFeed()
    }
  }

  const handleEmbedLoad = () => {
    if (!currentFeed?.matchId) return
    setVideoStateByMatch((prev) => ({ ...prev, [currentFeed.matchId]: "loaded" }))
  }

  const handleVideoError = () => {
    if (!currentFeed?.matchId) return
    setVideoStateByMatch((prev) => ({ ...prev, [currentFeed.matchId]: "error" }))
  }

  const isEmbedSource =
    currentStreamSource.kind === "youtube" || currentStreamSource.kind === "twitch"

  const videoStatusText =
    currentStreamSource.kind === "empty"
      ? currentFeed?.broadcastName
        ? `Broadcast: ${currentFeed.broadcastName}`
        : "API does not provide a browser-playable stream URL"
      : currentStreamSource.kind === "unsupported"
        ? currentStreamSource.reason ?? "Unsupported stream source"
        : currentVideoState === "ready"
          ? currentStreamSource.syncSupported
            ? "Video synced to feed clock"
            : currentFeed?.streamStatus === "REPLAY"
                ? "Replay clip is active"
                : "Broadcast video is active"
          : currentVideoState === "loaded"
            ? currentFeed?.source === "esports"
              ? "Embed loaded. Channel playback is not verified"
              : "Embed loaded. Provider playback is not verified"
          : currentVideoState === "loading"
            ? isEmbedSource
              ? "Loading broadcast embed"
              : currentFeed?.streamStatus === "REPLAY"
              ? "Loading replay clip"
              : "Loading video source"
            : isEmbedSource
              ? "Embed failed to load"
              : "Video failed to load"

  const videoOverlayTitle =
    currentStreamSource.kind === "empty"
      ? "No playable video from the feed"
      : currentStreamSource.kind === "unsupported"
        ? "This link cannot be embedded"
        : currentVideoState === "error"
          ? isEmbedSource
            ? "Broadcast embed could not be loaded"
            : "Video source could not be loaded"
          : isEmbedSource
            ? "Loading broadcast embed"
            : currentFeed?.streamStatus === "REPLAY"
            ? "Loading replay clip"
            : "Connecting video stream"

  const videoOverlayHint =
    currentStreamSource.kind === "unsupported"
      ? currentStreamSource.reason ?? "The API returned a stream URL that the browser cannot render."
      : currentStreamSource.kind !== "empty" && currentVideoState === "loading"
        ? isEmbedSource
          ? currentFeed?.source === "esports"
            ? `${currentFeed?.title ?? "This match"} uses a simulated esports replay timeline. The provider embed is loading, but the channel may still be offline or unavailable.`
            : `The provider embed is loading. Playback still depends on the upstream channel and embed policy.`
          : currentFeed?.streamStatus === "REPLAY"
          ? `${currentFeed?.title ?? "This match"} includes an upstream replay clip. Loading can take a few seconds on remote hosting.`
          : `The selected feed includes a stream URL and the browser is still trying to connect.`
        : currentStreamSource.kind !== "empty" && currentVideoState === "error"
          ? isEmbedSource
            ? currentFeed?.source === "esports"
              ? `The provider embed could not be loaded. The simulated esports timeline can continue even if the linked channel is offline or blocks embedding.`
              : `The provider embed could not be loaded by the browser.`
            : currentFeed?.streamStatus === "REPLAY"
            ? `The selected replay clip was present in the upstream feed, but the browser could not load it.`
            : `The provided stream URL could not be loaded by the browser.`
      : currentFeed
        ? currentFeed.source === "esports"
          ? currentFeed.broadcastName
            ? `${currentFeed.title} uses a simulated esports replay timeline. The linked channel may be offline or not embeddable right now.`
            : `${currentFeed.title} uses a simulated esports replay timeline and does not include a playable embed.`
          : currentFeed.broadcastName
            ? `${currentFeed.title} is listed on ${currentFeed.broadcastName}, but the feed does not expose a browser-playable stream URL.`
            : `The selected match has real scoreboard data, but no embedded stream URL from the upstream API.`
        : "Waiting for feed_state messages from the realtime server."

  const showVideoOverlay =
    currentStreamSource.kind === "empty" ||
    currentStreamSource.kind === "unsupported" ||
    currentVideoState === "loading" ||
    currentVideoState === "error"

  const canUseNativeVideo = currentStreamSource.kind === "video" && !!currentStreamSource.playableUrl
  const canUseEmbedFrame =
    (currentStreamSource.kind === "youtube" || currentStreamSource.kind === "twitch") &&
    !!currentStreamSource.playableUrl

  const currentSourceLabel =
    currentStreamSource.kind === "empty"
      ? currentFeed?.broadcastName
        ? `Broadcast: ${currentFeed.broadcastName}`
        : "No playable stream URL"
      : currentStreamSource.label
  const subtitleText =
    mode === "esports"
      ? "Simulated esports replay feed with normalized event timing"
      : currentStreamSource.syncSupported
        ? "Realtime prediction with synced video and event feed"
        : currentStreamSource.kind !== "empty" && currentFeed?.streamStatus === "REPLAY"
          ? "Replay clip with normalized event timing and browser-playable video"
          : "Realtime match feed with scoreboard and event updates"
  const clockLabelText = getClockLabel(currentFeed)
  const clockHintText = getClockHint(currentFeed)

  const badgeText = currentFeed?.streamStatus ?? "Live Feed"
  const activityItems = currentFeed
    ? eventLog.filter((event) => event.matchId === currentFeed.matchId).slice(0, 6)
    : []
  const canArmRound = Boolean(currentFeed?.isPlayable)

  const liveBadgeTone =
    currentFeed?.streamStatus === "LIVE"
      ? "text-live"
      : currentFeed?.streamStatus === "REPLAY"
        ? "text-primary"
        : "text-muted-foreground"

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.2_0.04_270)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,oklch(0.18_0.05_180)_0%,transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,oklch(0.16_0.04_290)_0%,transparent_40%)]" />
      </div>

      <div className="relative z-10">
        <PageHeader
          badgeText={badgeText}
          connectionState={connectionState}
          mode={mode}
          onModeChange={setMode}
          subtitleText={subtitleText}
        />

        <main className="mx-auto max-w-[1640px] px-6 py-8 xl:px-8">
          <div className="grid gap-6 lg:grid-cols-[252px_minmax(0,1fr)] xl:grid-cols-[236px_minmax(0,1fr)_288px] 2xl:grid-cols-[248px_minmax(0,1fr)_300px]">
            <div className="order-2 self-start lg:order-1 lg:sticky lg:top-6">
              <BroadcastList
                currentFeedMatchId={currentFeed?.matchId}
                currentStreams={currentStreams}
                onSelectBroadcast={handleSelectBroadcast}
              />
            </div>

            <div className="order-1 min-w-0 space-y-6 lg:order-2 xl:col-start-2">
              <VideoHero
                canArmRound={canArmRound}
                canUseEmbedFrame={canUseEmbedFrame}
                canUseNativeVideo={canUseNativeVideo}
                clockHintText={clockHintText}
                clockLabelText={clockLabelText}
                currentFeed={currentFeed}
                currentSourceLabel={currentSourceLabel}
                currentStreamSource={currentStreamSource}
                currentVideoState={currentVideoState}
                gameState={gameState}
                isVideoMuted={isVideoMuted}
                liveBadgeTone={liveBadgeTone}
                mode={mode}
                onArmRound={handleArmRound}
                onCatch={handleCatch}
                onEmbedLoad={handleEmbedLoad}
                onToggleVideoMute={handleToggleVideoMute}
                onVideoError={handleVideoError}
                onVideoReady={handleVideoReady}
                showVideoOverlay={showVideoOverlay}
                videoOverlayHint={videoOverlayHint}
                videoOverlayTitle={videoOverlayTitle}
                videoRef={videoRef}
                videoStatusText={videoStatusText}
              />

              <GamePanel
                canArmRound={canArmRound}
                currentFeed={currentFeed}
                gameState={gameState}
                guessMs={guessMs}
                mode={mode}
                onArmRound={handleArmRound}
                onCatch={handleCatch}
                result={result}
              />
            </div>

            <div className="order-3 lg:col-start-2 xl:col-start-3 xl:row-start-1 xl:sticky xl:top-6 xl:self-start">
              <RightRail
                activityItems={activityItems}
                canArmRound={canArmRound}
                currentFeed={currentFeed}
                currentPlayerId={currentPlayerId}
                currentSourceLabel={currentSourceLabel}
                leaderboard={leaderboard}
                onArmRound={handleArmRound}
                onReconnect={connect}
                onResetSession={handleResetSession}
                yourScore={yourScore}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
