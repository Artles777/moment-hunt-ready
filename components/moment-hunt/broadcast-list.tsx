import { Badge } from "@/components/ui/badge"
import { formatClockFromMs } from "@/lib/moment-hunt/format"
import type { FeedState } from "@/lib/moment-hunt/types"
import { Video } from "lucide-react"
import { GlassCard } from "@/components/moment-hunt/glass-card"

export function BroadcastList({
  currentFeedMatchId,
  currentStreams,
  onSelectBroadcast,
}: {
  currentFeedMatchId?: string | null
  currentStreams: FeedState[]
  onSelectBroadcast: (feed: FeedState) => void
}) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Broadcasts</h3>
        </div>
        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[10px] uppercase tracking-wider text-primary">
          {currentStreams.length} feeds
        </Badge>
      </div>
      {currentStreams.length === 0 ? (
        <p className="text-sm text-muted-foreground">Waiting for feed_state messages from the realtime server.</p>
      ) : (
        <div className="space-y-2">
          {currentStreams.map((feed) => {
            const isActive = feed.matchId === currentFeedMatchId

            return (
              <button
                key={feed.matchId}
                type="button"
                onClick={() => onSelectBroadcast(feed)}
                className={`w-full rounded-2xl px-4 py-3 text-left transition-colors ${
                  isActive
                    ? "bg-primary/10 ring-1 ring-primary/25"
                    : "bg-surface/50 hover:bg-surface/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-sm ${isActive ? "font-semibold text-primary" : "font-medium text-foreground"}`}>
                      {feed.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{feed.competition}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/90">
                      {feed.homeTeam} {feed.homeScore ?? "-"}:{feed.awayScore ?? "-"} {feed.awayTeam}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-medium tracking-wider ring-1 ${
                    feed.streamStatus === "LIVE"
                      ? "bg-live/10 text-live ring-live/15"
                      : feed.streamStatus === "REPLAY"
                        ? "bg-primary/10 text-primary ring-primary/20"
                        : "bg-secondary/60 text-secondary-foreground ring-border"
                  }`}>
                    {feed.streamStatus}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{feed.statusDetail}</span>
                  <span className="font-mono">{feed.isPlayable ? formatClockFromMs(feed.clockMs) : "--:--"}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
