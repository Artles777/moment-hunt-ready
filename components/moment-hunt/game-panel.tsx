import { Button } from "@/components/ui/button"
import { formatClockFromMs } from "@/lib/moment-hunt/format"
import type { FeedState, GameState, Mode, RoundResult } from "@/lib/moment-hunt/types"
import { ChevronRight, Play, Sparkles, Target } from "lucide-react"
import { GlassCard } from "@/components/moment-hunt/glass-card"

export function GamePanel({
  canArmRound,
  currentFeed,
  gameState,
  guessMs,
  mode,
  onArmRound,
  onCatch,
  result,
}: {
  canArmRound: boolean
  currentFeed: FeedState | null
  gameState: GameState
  guessMs: number | null
  mode: Mode
  onArmRound: () => void
  onCatch: () => void
  result: RoundResult | null
}) {
  return (
    <GlassCard glow={gameState === "armed"} className="p-8">
      <div className="flex flex-col items-center text-center">
        {gameState === "idle" && (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {!currentFeed
                ? "Pick a broadcast and wait for feed_state before starting a round."
                : canArmRound
                  ? `Arm a round, then click when you think the next ${mode === "sports" ? "football" : "esports"} event is happening.`
                  : "This match has real scoreboard data, but no active event replay is available yet."}
            </p>
            <p className="mb-6 text-xs text-muted-foreground">
              {currentFeed?.statusDetail ?? "The frontend does not know future events. It only receives them from the realtime feed after they happen."}
            </p>
            <Button
              size="lg"
              onClick={onArmRound}
              disabled={!canArmRound}
              className="gap-2 rounded-xl px-8 py-6 text-base shadow-lg shadow-primary/20"
            >
              <Play className="h-4 w-4" />
              Arm Next Round
            </Button>
          </>
        )}

        {gameState === "armed" && (
          <>
            <p className="mb-6 text-sm text-muted-foreground">Click when you think the next key event is happening.</p>
            <button
              onClick={onCatch}
              className="group relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-[0_0_60px_-15px] shadow-primary/50 transition-all hover:scale-105 active:scale-95 sm:h-40 sm:w-40"
            >
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary/20 to-transparent" />
              <div className="relative flex flex-col items-center gap-1">
                <Target className="h-8 w-8 text-primary-foreground sm:h-10 sm:w-10" />
                <span className="text-sm font-semibold text-primary-foreground sm:text-base">Catch</span>
              </div>
            </button>
            <p className="mt-6 text-xs text-muted-foreground">Waiting for the next realtime event from the feed.</p>
          </>
        )}

        {gameState === "guess-locked" && (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Prediction Locked</span>
            </div>
            <p className="text-lg text-foreground">
              Your guess at <span className="font-mono font-semibold text-primary">{formatClockFromMs(guessMs ?? 0)}</span>
            </p>
            <p className="text-sm text-muted-foreground">Waiting for the actual event to arrive through WebSocket.</p>
          </div>
        )}

        {gameState === "resolved" && result && (
          <ResultCard result={result} onNext={onArmRound} />
        )}
      </div>
    </GlassCard>
  )
}

function ResultCard({ result, onNext }: { result: RoundResult; onNext: () => void }) {
  const tone =
    result.verdict === "Perfect"
      ? { bg: "bg-success/10", text: "text-success", ring: "ring-success/30" }
      : result.verdict === "Close"
        ? { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/30" }
        : result.verdict === "Almost"
          ? { bg: "bg-warning/10", text: "text-warning", ring: "ring-warning/30" }
          : result.verdict === "Near"
            ? { bg: "bg-secondary/70", text: "text-secondary-foreground", ring: "ring-border" }
          : { bg: "bg-destructive/10", text: "text-destructive", ring: "ring-destructive/30" }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-center">
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}>
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">{result.verdict}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-surface/50 p-4 text-left">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Resolved event</p>
        <p className="mt-1 text-lg font-medium text-foreground">{result.eventLabel}</p>
        <p className="text-sm text-muted-foreground">{result.eventType}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Your Click" value={result.clickMs === null ? "--:--" : formatClockFromMs(result.clickMs)} />
        <StatCard label="Actual" value={formatClockFromMs(result.actualMs)} />
        <StatCard label="Delta" value={result.deltaMs === null ? "--" : `${(result.deltaMs / 1000).toFixed(1)}s`} />
      </div>

      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">Points earned</span>
        <span className={`text-2xl font-semibold ${tone.text}`}>+{result.score}</span>
      </div>

      <Button onClick={onNext} className="w-full gap-2 rounded-xl bg-secondary/80 text-secondary-foreground hover:bg-secondary">
        Arm Next Round
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface/50 p-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-medium text-foreground">{value}</p>
    </div>
  )
}
