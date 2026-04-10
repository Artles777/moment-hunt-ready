import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ConnectionState, Mode } from "@/lib/moment-hunt/types"
import { Target, Trophy, Wifi, WifiOff, Zap } from "lucide-react"

export function PageHeader({
  badgeText,
  connectionState,
  mode,
  onModeChange,
  subtitleText,
}: {
  badgeText: string
  connectionState: ConnectionState
  mode: Mode
  onModeChange: (mode: Mode) => void
  subtitleText: string
}) {
  const streamStatusTone =
    connectionState === "connected"
      ? "text-success"
      : connectionState === "connecting"
        ? "text-warning"
        : "text-destructive"

  return (
    <header className="border-b border-border/50 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1640px] flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between xl:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Moment Hunt</h1>
            <p className="text-xs text-muted-foreground">{subtitleText}</p>
          </div>
          <Badge variant="outline" className="ml-2 border-primary/30 bg-primary/5 text-xs font-medium text-primary">
            {badgeText}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 text-xs font-medium ${streamStatusTone}`}>
            {connectionState === "connected" ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span>{connectionState === "connected" ? "WebSocket live" : connectionState === "connecting" ? "Connecting" : "Disconnected"}</span>
          </div>
          <Tabs value={mode} onValueChange={(value) => onModeChange(value as Mode)}>
            <TabsList className="h-10 gap-1 rounded-xl bg-secondary/50 p-1 backdrop-blur-sm">
              <TabsTrigger value="sports" className="gap-2 rounded-lg px-4 text-sm data-[state=active]:bg-background/80 data-[state=active]:shadow-sm">
                <Trophy className="h-3.5 w-3.5" />
                Sports
              </TabsTrigger>
              <TabsTrigger value="esports" className="gap-2 rounded-lg px-4 text-sm data-[state=active]:bg-background/80 data-[state=active]:shadow-sm">
                <Zap className="h-3.5 w-3.5" />
                Esports
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </header>
  )
}
