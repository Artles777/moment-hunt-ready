import type { ParsedStreamSource } from "@/lib/moment-hunt/types"

function extractYouTubeVideoId(url: URL) {
  if (url.hostname === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null
  }

  if (url.pathname === "/watch") {
    return url.searchParams.get("v")
  }

  const segments = url.pathname.split("/").filter(Boolean)
  const markerIndex = segments.findIndex((segment) =>
    ["embed", "live", "shorts"].includes(segment),
  )

  if (markerIndex >= 0) {
    return segments[markerIndex + 1] ?? null
  }

  return null
}

export function parseStreamSource(
  rawUrl: string,
  parentHost: string,
  syncSupportedOverride?: boolean,
): ParsedStreamSource {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return {
      kind: "empty",
      originalUrl: "",
      playableUrl: null,
      syncSupported: false,
      label: "No stream configured",
    }
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(trimmed)
  } catch {
    return {
      kind: "unsupported",
      originalUrl: trimmed,
      playableUrl: null,
      syncSupported: false,
      label: "Unsupported URL",
      reason: "Use a full https:// link to a direct video, YouTube, or Twitch stream.",
    }
  }

  const hostname = parsedUrl.hostname.replace(/^www\./, "")
  const pathname = parsedUrl.pathname.toLowerCase()

  if (["youtube.com", "youtu.be"].includes(hostname)) {
    const videoId = extractYouTubeVideoId(parsedUrl)
    if (!videoId) {
      return {
        kind: "unsupported",
        originalUrl: trimmed,
        playableUrl: null,
        syncSupported: false,
        label: "YouTube link is incomplete",
        reason: "Could not extract a YouTube video ID from that URL.",
      }
    }

    return {
      kind: "youtube",
      originalUrl: trimmed,
      playableUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`,
      syncSupported: syncSupportedOverride ?? false,
      label: "YouTube embed",
    }
  }

  if (hostname === "twitch.tv") {
    const segments = parsedUrl.pathname.split("/").filter(Boolean)
    const firstSegment = segments[0]

    if (!firstSegment) {
      return {
        kind: "unsupported",
        originalUrl: trimmed,
        playableUrl: null,
        syncSupported: false,
        label: "Twitch link is incomplete",
        reason: "Add a Twitch channel URL like https://twitch.tv/channel-name.",
      }
    }

    if (firstSegment === "videos" && segments[1]) {
      return {
        kind: "twitch",
        originalUrl: trimmed,
        playableUrl: `https://player.twitch.tv/?video=v${segments[1]}&parent=${encodeURIComponent(parentHost)}&autoplay=true&muted=true`,
        syncSupported: syncSupportedOverride ?? false,
        label: "Twitch video embed",
      }
    }

    return {
      kind: "twitch",
      originalUrl: trimmed,
      playableUrl: `https://player.twitch.tv/?channel=${encodeURIComponent(firstSegment)}&parent=${encodeURIComponent(parentHost)}&autoplay=true&muted=true`,
      syncSupported: syncSupportedOverride ?? false,
      label: "Twitch live embed",
    }
  }

  if (/\.(mp4|webm|ogg|mov|m3u8)(\?|#|$)/i.test(pathname)) {
    return {
      kind: "video",
      originalUrl: trimmed,
      playableUrl: trimmed,
      syncSupported: syncSupportedOverride ?? true,
      label: pathname.endsWith(".m3u8") ? "Direct HLS stream" : "Direct video source",
    }
  }

  return {
    kind: "unsupported",
    originalUrl: trimmed,
    playableUrl: null,
    syncSupported: false,
    label: "Unsupported URL",
    reason: "Use a direct video URL or a YouTube/Twitch link that allows embedding.",
  }
}
