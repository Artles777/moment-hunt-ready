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
  STORAGE_KEY,
  upsertLeaderboard,
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
          const byStatus = FEED_STATUS_ORDER[left.streamStatus] - FEED_STATUS_ORDER[right.streamStatus]
          if (byStatus !== 0) return byStatus

          const byPlayability = Number(right.isPlayable) - Number(left.isPlayable)
          if (byPlayability !== 0) return byPlayability

          return left.title.localeCompare(right.title)
        }),
    [feedsByMatch, mode],
  )
  const currentFeed = useMemo(() => {
    if (selectedMatchId && feedsByMatch[selectedMatchId]?.source === mode) {
      return feedsByMatch[selectedMatchId]
    }

    return currentStreams[0] ?? null
  }, [currentStreams, feedsByMatch, mode, selectedMatchId])
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
    () => leaderboard.find((entry) => entry.player === "You")?.score ?? 0,
    [leaderboard],
  )

  useEffect(() => {
    const fromStorage = window.localStorage.getItem(STORAGE_KEY)
    if (!fromStorage) return

    try {
      const parsed = JSON.parse(fromStorage) as LeaderboardEntry[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        setLeaderboard(parsed)
      }
    } catch {
      // ignore bad storage
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leaderboard))
  }, [leaderboard])

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
      setLeaderboard((prev) => upsertLeaderboard(prev, score))
    }
  }, [gameState, guessMs, resolvedEventIds, targetEvent])

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

  const handleResetSession = () => {
    setGameState("idle")
    setTargetEvent(null)
    setGuessMs(null)
    setResult(null)
    setResolvedEventIds([])
    clearEventLog()
    setLeaderboard(DEFAULT_LEADERBOARD)
    window.localStorage.removeItem(STORAGE_KEY)
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

  const handleVideoError = () => {
    if (!currentFeed?.matchId) return
    setVideoStateByMatch((prev) => ({ ...prev, [currentFeed.matchId]: "error" }))
  }

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
            : currentFeed?.source === "esports"
              ? "Demo broadcast embed is active"
              : "Broadcast embed is active"
          : currentVideoState === "loading"
            ? "Loading video source"
            : "Video failed to load"

  const videoOverlayTitle =
    currentStreamSource.kind === "empty"
      ? "No playable video from the feed"
      : currentStreamSource.kind === "unsupported"
        ? "This link cannot be embedded"
        : currentVideoState === "error"
          ? "Video source could not be loaded"
          : "Connecting video stream"

  const videoOverlayHint =
    currentStreamSource.kind === "unsupported"
      ? currentStreamSource.reason ?? "The API returned a stream URL that the browser cannot render."
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
    currentFeed?.broadcastName
      ? `Broadcast: ${currentFeed.broadcastName}`
      : !currentFeed?.streamUrl
        ? "No playable stream URL"
        : currentStreamSource.label

  const subtitleText =
    mode === "esports"
      ? "Simulated esports replay feed with normalized event timing"
      : currentStreamSource.syncSupported
        ? "Realtime prediction with synced video and event feed"
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
