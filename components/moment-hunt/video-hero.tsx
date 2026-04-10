import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { Button } from "@/components/ui/button"
import type {
  FeedState,
  GameState,
  Mode,
  ParsedStreamSource,
  VideoLoadState,
} from "@/lib/moment-hunt/types"
import { Expand, Minimize2, Play, Radio, RefreshCw, Sparkles, Target, Video, Volume2, VolumeX } from "lucide-react"
import { GlassCard } from "@/components/moment-hunt/glass-card"
import { formatClockFromMs } from "@/lib/moment-hunt/format"

export function VideoHero({
  canArmRound,
  canUseEmbedFrame,
  canUseNativeVideo,
  clockHintText,
  clockLabelText,
  currentFeed,
  currentSourceLabel,
  currentStreamSource,
  currentVideoState,
  gameState,
  isVideoMuted,
  liveBadgeTone,
  mode,
  onArmRound,
  onCatch,
  onToggleVideoMute,
  onEmbedLoad,
  onVideoError,
  onVideoReady,
  showVideoOverlay,
  videoOverlayHint,
  videoOverlayTitle,
  videoRef,
  videoStatusText,
}: {
  canArmRound: boolean
  canUseEmbedFrame: boolean
  canUseNativeVideo: boolean
  clockHintText: string
  clockLabelText: string
  currentFeed: FeedState | null
  currentSourceLabel: string
  currentStreamSource: ParsedStreamSource
  currentVideoState: VideoLoadState
  gameState: GameState
  isVideoMuted: boolean
  liveBadgeTone: string
  mode: Mode
  onArmRound: () => void
  onCatch: () => void
  onToggleVideoMute: () => void
  onEmbedLoad: () => void
  onVideoError: () => void
  onVideoReady: () => void
  showVideoOverlay: boolean
  videoOverlayHint: string
  videoOverlayTitle: string
  videoRef: RefObject<HTMLVideoElement | null>
  videoStatusText: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const handleToggleFullscreen = useCallback(async () => {
    const container = containerRef.current
    if (!container) return

    if (document.fullscreenElement === container) {
      await document.exitFullscreen().catch(() => undefined)
      return
    }

    await container.requestFullscreen().catch(() => undefined)
  }, [])

  const showFullscreenArmButton = isFullscreen && (gameState === "idle" || gameState === "resolved")
  const showFullscreenCatchOverlay = isFullscreen && gameState === "armed" && canArmRound
  const showFullscreenCatchButton = isFullscreen && gameState === "armed" && canArmRound
  const roundStatusText =
    isFullscreen && gameState === "armed"
      ? "Fullscreen catch mode. Use Catch or click anywhere on the player to lock your time."
      : isFullscreen && gameState === "guess-locked"
        ? "Prediction locked. Waiting for the actual event."
        : null

  return (
    <GlassCard className="overflow-hidden">
      <div
        ref={containerRef}
        className={`relative overflow-hidden bg-black ${isFullscreen ? "h-screen w-screen" : "aspect-[16/10] md:aspect-[16/9]"}`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url(${currentFeed?.posterUrl ?? "/placeholder.jpg"})` }}
        />

        {canUseNativeVideo && (
          <video
            key={`${currentFeed?.matchId ?? mode}-${currentFeed?.streamUrl ?? "empty"}`}
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={currentStreamSource.playableUrl ?? undefined}
            poster={currentFeed?.posterUrl ?? "/placeholder.jpg"}
            autoPlay
            loop={!currentStreamSource.syncSupported}
            muted={isVideoMuted}
            playsInline
            preload="auto"
            onCanPlay={onVideoReady}
            onError={onVideoError}
          />
        )}

        {canUseEmbedFrame && (
          <iframe
            key={`${currentFeed?.matchId ?? mode}-${currentFeed?.streamUrl ?? "empty"}`}
            title={`${currentFeed?.title ?? mode} live stream`}
            className="absolute inset-0 h-full w-full border-0"
            src={currentStreamSource.playableUrl ?? undefined}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={onEmbedLoad}
            onError={onVideoError}
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-background/60" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.78_0.14_180/0.18),transparent_32%),radial-gradient(circle_at_bottom_right,oklch(0.72_0.12_290/0.16),transparent_28%)]" />

        {showFullscreenCatchOverlay && (
          <button
            type="button"
            onClick={onCatch}
            className="absolute inset-0 z-10 cursor-crosshair bg-transparent"
            aria-label="Catch current moment"
          />
        )}

        {showVideoOverlay && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/55 ring-1 ring-white/10 backdrop-blur-md">
              {currentStreamSource.kind !== "unsupported" && currentVideoState === "loading" ? (
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <Video className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-foreground">{videoOverlayTitle}</p>
              <p className="max-w-md text-sm text-muted-foreground">{videoOverlayHint}</p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
            </span>
            <span className={`text-xs font-medium ${liveBadgeTone}`}>{currentFeed?.streamStatus ?? "FEED"}</span>
          </div>

          <div className="absolute right-4 top-4 flex items-start gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{currentFeed?.title ?? "Waiting for feed"}</p>
              <p className="text-xs text-muted-foreground">{currentFeed?.competition ?? "Realtime source"}</p>
              <p className="text-[11px] text-muted-foreground/90">
                {currentFeed?.statusDetail ?? currentFeed?.broadcastName ?? ""}
              </p>
            </div>
            <div className="pointer-events-auto relative z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleVideoMute}
                disabled={!canUseNativeVideo}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/50 text-foreground ring-1 ring-white/10 backdrop-blur-md transition-colors hover:bg-background/70 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={isVideoMuted ? "Unmute video" : "Mute video"}
              >
                {isVideoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/50 text-foreground ring-1 ring-white/10 backdrop-blur-md transition-colors hover:bg-background/70"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-background/45 px-4 py-3 backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Video source</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{currentSourceLabel}</p>
                </div>
                <div className="rounded-2xl bg-background/45 px-4 py-3 backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Sync state</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{videoStatusText}</p>
                </div>
              </div>

              <div className="pointer-events-auto relative z-20 flex flex-wrap items-center gap-3">
                {showFullscreenArmButton ? (
                  <Button
                    size="lg"
                    onClick={onArmRound}
                    disabled={!canArmRound}
                    className="h-11 rounded-xl px-5 shadow-lg shadow-primary/30"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Arm Next Round
                  </Button>
                ) : showFullscreenCatchButton ? (
                  <Button
                    size="lg"
                    onClick={onCatch}
                    className="h-11 rounded-xl px-5 shadow-lg shadow-primary/30"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Catch
                  </Button>
                ) : roundStatusText ? (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-background/55 px-4 py-3 text-sm text-foreground ring-1 ring-white/10 backdrop-blur-md">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>{roundStatusText}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="self-start rounded-2xl bg-background/55 px-4 py-3 text-right backdrop-blur-md sm:self-auto">
              <div className="mb-1 flex items-center justify-end gap-2 text-muted-foreground">
                <Radio className="h-4 w-4 animate-pulse opacity-60" />
                <span className="text-[10px] uppercase tracking-[0.22em]">{clockLabelText}</span>
              </div>
              <span className="font-mono text-3xl font-light tracking-tight text-foreground sm:text-4xl">
                {formatClockFromMs(currentFeed?.clockMs ?? 0)}
              </span>
              {clockHintText && (
                <p className="mt-1 text-[11px] text-muted-foreground">{clockHintText}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
