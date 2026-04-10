export function GlassCard({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode
  className?: string
  glow?: boolean
}) {
  return (
    <div
      className={`relative rounded-2xl border border-border bg-glass backdrop-blur-xl ${
        glow ? "shadow-[0_0_40px_-10px] shadow-primary/20" : ""
      } ${className}`}
    >
      {children}
    </div>
  )
}
