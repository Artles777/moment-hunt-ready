import { Button } from "@/components/ui/button"
import type { EventLog, FeedState, LeaderboardEntry } from "@/lib/moment-hunt/types"
import { Activity, Play, Radio, RefreshCw, RotateCcw, Timer, Trophy } from "lucide-react"
import { GlassCard } from "@/components/moment-hunt/glass-card"

export function RightRail({
  activityItems,
  canArmRound,
  currentFeed,
  currentSourceLabel,
  leaderboard,
  onArmRound,
  onReconnect,
  onResetSession,
  yourScore,
}: {
  activityItems: EventLog[]
  canArmRound: boolean
  currentFeed: FeedState | null
  currentSourceLabel: string
  leaderboard: LeaderboardEntry[]
  onArmRound: () => void
  onReconnect: () => void
  onResetSession: () => void
  yourScore: number
}) {
  return (
    <div className="space-y-5">
      <GlassCard glow className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Score</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-primary">{yourScore}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 gap-2 rounded-lg bg-secondary/50"
            onClick={onArmRound}
            disabled={!canArmRound}
          >
            <Play className="h-3.5 w-3.5" />
            Arm
          </Button>
          <Button variant="secondary" size="sm" className="flex-1 gap-2 rounded-lg bg-secondary/50" onClick={onResetSession}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button variant="secondary" size="sm" className="rounded-lg bg-secondary/50 px-3" onClick={onReconnect}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-medium text-foreground">Leaderboard</h3>
        </div>
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div key={entry.player} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${entry.player === "You" ? "bg-primary/10 ring-1 ring-primary/20" : "bg-surface/50"}`}>
              <div className="flex items-center gap-3">
                <span className="w-5 text-center text-sm font-medium text-muted-foreground">{entry.rank}</span>
                <span className={`text-sm ${entry.player === "You" ? "font-medium text-primary" : "text-foreground"}`}>{entry.player}</span>
              </div>
              <span className="font-mono text-sm tabular-nums text-foreground">{entry.score}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Selected Feed</h3>
        </div>
        {currentFeed ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-surface/50 p-4">
              <p className="text-sm font-medium text-foreground">{currentFeed.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{currentFeed.competition}</p>
              <p className="mt-2 text-[11px] font-medium text-primary">
                {currentFeed.source === "esports" ? "Simulated demo feed" : "Real sports feed"}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">{currentFeed.venue}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {currentFeed.homeTeam} {currentFeed.homeScore ?? "-"}:{currentFeed.awayScore ?? "-"} {currentFeed.awayTeam}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Match ID</p>
                <p className="mt-1 text-xs font-medium text-foreground">{currentFeed.matchId}</p>
              </div>
              <div className="rounded-xl bg-surface/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transport</p>
                <p className="mt-1 text-xs font-medium text-foreground">WebSocket + {currentSourceLabel}</p>
              </div>
            </div>
            <div className="rounded-xl bg-surface/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
              <p className="mt-1 text-xs font-medium text-foreground">{currentFeed.statusDetail}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active broadcast selected yet.</p>
        )}
      </GlassCard>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Activity</h3>
        </div>
        {activityItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events received yet for the selected broadcast</p>
        ) : (
          <div className="space-y-2">
            {activityItems.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg bg-surface/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary">{event.type}</span>
                  <span className="text-xs text-muted-foreground">{event.team}</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{event.time}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Architecture notes</h3>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• sports feeds are real scoreboard data, esports feeds are clearly labeled simulated demo replays</li>
          <li>• stream catalog and active video metadata both come from WebSocket feed_state messages</li>
          <li>• video playback is tied to the selected match instead of a manually pasted URL</li>
          <li>• feed is pushed over WebSocket, not hardcoded in the UI</li>
          <li>• scoring is source-agnostic and only depends on timestamp delta</li>
        </ul>
      </GlassCard>
    </div>
  )
}
