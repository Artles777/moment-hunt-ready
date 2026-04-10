const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer'
const FEED_REFRESH_MS = 60_000
const FEED_BROADCAST_MS = 1_000
const REPLAY_TICK_MS = 250
const REPLAY_SPEED = 20
const ESPORTS_REPLAY_SPEED = 18
const REPLAY_LOOP_PAUSE_MS = 2_000

const LEAGUES = [
  'eng.1',
  'esp.1',
  'ita.1',
  'ger.1',
  'uefa.champions',
]

const ESPORTS_FEEDS = [
  {
    id: 'valorant-masters-demo',
    title: 'Sentinels vs Paper Rex',
    competition: 'Simulated esports demo',
    venue: 'Virtual Stage Alpha',
    homeTeam: 'Sentinels',
    awayTeam: 'Paper Rex',
    homeScore: 2,
    awayScore: 1,
    streamUrl: 'https://twitch.tv/riotgames',
    broadcastName: 'Twitch: riotgames',
    posterUrl: buildEsportsPosterUrl('VALORANT Masters', 'Sentinels vs Paper Rex', '#ff4655', '#0f1923'),
    statusDetail: 'Simulated esports replay feed. Video availability depends on the official channel schedule.',
    durationMs: 36 * 60 * 1000,
    events: [
      { id: 'vlr-1', eventType: 'pistol_round_win', eventTimestamp: 2 * 60 * 1000, label: 'Sentinels take the pistol round', team: 'Sentinels' },
      { id: 'vlr-2', eventType: 'spike_defuse', eventTimestamp: 7 * 60 * 1000, label: 'Paper Rex defuse with 0.8s left', team: 'Paper Rex' },
      { id: 'vlr-3', eventType: 'ace', eventTimestamp: 12 * 60 * 1000, label: 'TenZ closes the round with an ace', team: 'Sentinels' },
      { id: 'vlr-4', eventType: 'eco_break', eventTimestamp: 17 * 60 * 1000, label: 'Paper Rex break the economy', team: 'Paper Rex' },
      { id: 'vlr-5', eventType: 'clutch_1v2', eventTimestamp: 23 * 60 * 1000, label: 'Late 1v2 clutch on A site', team: 'Sentinels' },
      { id: 'vlr-6', eventType: 'series_point', eventTimestamp: 30 * 60 * 1000, label: 'Sentinels reach series point', team: 'Sentinels' },
      { id: 'vlr-7', eventType: 'series_win', eventTimestamp: 34 * 60 * 1000, label: 'Sentinels close the series', team: 'Sentinels' },
    ],
  },
  {
    id: 'league-worlds-demo',
    title: 'T1 vs G2 Esports',
    competition: 'Simulated esports demo',
    venue: 'Summoners Rift Arena',
    homeTeam: 'T1',
    awayTeam: 'G2',
    homeScore: 3,
    awayScore: 1,
    streamUrl: 'https://twitch.tv/lck',
    broadcastName: 'Twitch: lck',
    posterUrl: buildEsportsPosterUrl('League Worlds', 'T1 vs G2', '#c89b3c', '#0a1428'),
    statusDetail: 'Simulated esports replay feed. Video availability depends on the official channel schedule.',
    durationMs: 38 * 60 * 1000,
    events: [
      { id: 'lol-1', eventType: 'first_blood', eventTimestamp: 3 * 60 * 1000, label: 'First blood in the top lane', team: 'T1' },
      { id: 'lol-2', eventType: 'dragon_secure', eventTimestamp: 9 * 60 * 1000, label: 'Infernal dragon secured', team: 'G2' },
      { id: 'lol-3', eventType: 'tower_destroyed', eventTimestamp: 14 * 60 * 1000, label: 'Mid outer turret falls', team: 'T1' },
      { id: 'lol-4', eventType: 'rift_herald', eventTimestamp: 18 * 60 * 1000, label: 'Herald crashes for two plates', team: 'T1' },
      { id: 'lol-5', eventType: 'baron_secure', eventTimestamp: 26 * 60 * 1000, label: 'Clean Baron setup after a pick', team: 'T1' },
      { id: 'lol-6', eventType: 'teamfight_win', eventTimestamp: 31 * 60 * 1000, label: 'G2 lose the river fight', team: 'T1' },
      { id: 'lol-7', eventType: 'nexus_destroyed', eventTimestamp: 35 * 60 * 1000, label: 'T1 finish through bot lane', team: 'T1' },
    ],
  },
  {
    id: 'cs2-iem-demo',
    title: 'Natus Vincere vs FaZe',
    competition: 'Simulated esports demo',
    venue: 'IEM Demo Arena',
    homeTeam: 'Natus Vincere',
    awayTeam: 'FaZe',
    homeScore: 2,
    awayScore: 0,
    streamUrl: 'https://twitch.tv/esl_csgo',
    broadcastName: 'Twitch: esl_csgo',
    posterUrl: buildEsportsPosterUrl('Counter-Strike 2', 'NaVi vs FaZe', '#f7c52b', '#111827'),
    statusDetail: 'Simulated esports replay feed. Video availability depends on the official channel schedule.',
    durationMs: 34 * 60 * 1000,
    events: [
      { id: 'cs2-1', eventType: 'pistol_round_win', eventTimestamp: 90 * 1000, label: 'NaVi convert the pistol', team: 'Natus Vincere' },
      { id: 'cs2-2', eventType: 'force_buy_break', eventTimestamp: 6 * 60 * 1000, label: 'FaZe force buy gets shut down', team: 'Natus Vincere' },
      { id: 'cs2-3', eventType: 'bomb_defuse', eventTimestamp: 11 * 60 * 1000, label: 'Tense 2v2 defuse on A', team: 'FaZe' },
      { id: 'cs2-4', eventType: 'clutch_1v3', eventTimestamp: 16 * 60 * 1000, label: 'NaVi steal a 1v3 clutch', team: 'Natus Vincere' },
      { id: 'cs2-5', eventType: 'eco_round', eventTimestamp: 21 * 60 * 1000, label: 'Full eco stacks the B site', team: 'FaZe' },
      { id: 'cs2-6', eventType: 'map_point', eventTimestamp: 28 * 60 * 1000, label: 'NaVi reach map point', team: 'Natus Vincere' },
      { id: 'cs2-7', eventType: 'series_win', eventTimestamp: 32 * 60 * 1000, label: 'NaVi close the final round', team: 'Natus Vincere' },
    ],
  },
]

const runtimeFeeds = new Map()
const listeners = new Set()

let runtimeStarted = false
let startPromise = null

function notifyListeners(payload) {
  for (const listener of listeners) {
    try {
      listener(payload)
    } catch (error) {
      console.error('[moment-hunt] failed to notify realtime listener', error)
    }
  }
}

function asNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toClockMs(value) {
  const numeric = asNumber(value)
  return numeric === null ? 0 : Math.max(0, Math.round(numeric * 1000))
}

function parseDisplayClockMs(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null

  const addedTimeMatch = raw.match(/^(\d+)'?\+(\d+)'?$/)
  if (addedTimeMatch) {
    const [, baseMinutes, addedMinutes] = addedTimeMatch
    return (Number(baseMinutes) + Number(addedMinutes)) * 60 * 1000
  }

  const minuteSecondMatch = raw.match(/^(\d+):(\d{2})$/)
  if (minuteSecondMatch) {
    const [, minutes, seconds] = minuteSecondMatch
    return (Number(minutes) * 60 + Number(seconds)) * 1000
  }

  const minuteOnlyMatch = raw.match(/^(\d+)'?$/)
  if (minuteOnlyMatch) {
    return Number(minuteOnlyMatch[1]) * 60 * 1000
  }

  return null
}

function resolveStatusClockMs(...statuses) {
  for (const status of statuses) {
    const displayClockMs = parseDisplayClockMs(status?.displayClock)
    const clockMs = toClockMs(status?.clock)
    const resolvedClockMs = Math.max(displayClockMs ?? 0, clockMs)

    if (resolvedClockMs > 0) {
      return resolvedClockMs
    }
  }

  return 0
}

function toFeedStatus(eventState, hasReplay) {
  if (eventState === 'in') return 'LIVE'
  if (eventState === 'post' && hasReplay) return 'REPLAY'
  if (eventState === 'post') return 'FINAL'
  return 'SCHEDULED'
}

function normalizeType(type = '') {
  return String(type).trim().toLowerCase().replaceAll('-', '_') || 'match_event'
}

function normalizeEventTimeline(summary) {
  const rawEvents = summary?.keyEvents ?? summary?.scoringPlays ?? []

  return rawEvents
    .filter((item) => item?.team?.displayName)
    .filter((item) => item?.scoringPlay || ['goal', 'yellow_card', 'red_card', 'substitution'].includes(normalizeType(item?.type?.type)))
    .map((item) => ({
      id: String(item.id),
      eventType: normalizeType(item?.type?.type ?? item?.type?.text),
      eventTimestamp: toClockMs(item?.clock?.value),
      label: item?.shortText ?? item?.text ?? item?.type?.text ?? 'Match event',
      team: item?.team?.displayName ?? 'Match',
    }))
    .filter((item) => item.eventTimestamp >= 0)
    .sort((left, right) => left.eventTimestamp - right.eventTimestamp)
}

function buildBroadcastName(competition, summary) {
  const fromScoreboard = competition?.broadcasts?.flatMap((item) => item?.names ?? []) ?? []
  if (fromScoreboard.length > 0) return fromScoreboard.join(', ')

  const fromSummary = summary?.header?.competitions?.[0]?.broadcasts
    ?.map((item) => item?.media?.shortName)
    .filter(Boolean) ?? []

  return fromSummary.length > 0 ? fromSummary.join(', ') : null
}

function buildPosterUrl(homeTeam, awayTeam, leagueLogo) {
  return homeTeam?.logo ?? awayTeam?.logo ?? leagueLogo ?? '/placeholder.jpg'
}

function buildEsportsPosterUrl(title, subtitle, startColor, endColor) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${startColor}"/>
          <stop offset="100%" stop-color="${endColor}"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <circle cx="1080" cy="120" r="180" fill="rgba(255,255,255,0.08)"/>
      <circle cx="180" cy="620" r="220" fill="rgba(255,255,255,0.06)"/>
      <text x="72" y="132" fill="rgba(255,255,255,0.68)" font-family="Arial, sans-serif" font-size="28" letter-spacing="6">SIMULATED ESPORTS FEED</text>
      <text x="72" y="348" fill="#ffffff" font-family="Arial, sans-serif" font-size="84" font-weight="700">${title}</text>
      <text x="72" y="430" fill="rgba(255,255,255,0.86)" font-family="Arial, sans-serif" font-size="42">${subtitle}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function firstNonEmptyString(candidates) {
  return candidates.find((value) => typeof value === 'string' && value.trim().length > 0) ?? ''
}

function pickPlayableVideo(summary) {
  const videos = Array.isArray(summary?.videos) ? summary.videos : []

  for (const video of videos) {
    const streamUrl = firstNonEmptyString([
      video?.links?.source?.full?.href,
      video?.links?.source?.href,
      video?.links?.mobile?.source?.href,
      video?.links?.source?.HD?.href,
      video?.links?.source?.HLS?.HD?.href,
      video?.links?.source?.HLS?.href,
    ])

    if (!streamUrl) {
      continue
    }

    return {
      streamUrl,
      streamSyncSupported: false,
      posterUrl: video?.thumbnail ?? null,
    }
  }

  return {
    streamUrl: '',
    streamSyncSupported: false,
    posterUrl: null,
  }
}

function getRuntimeClockMs(feed) {
  if (feed.streamStatus === 'LIVE') {
    return Math.max(0, Date.now() - feed.startedAt)
  }

  if (feed.streamStatus === 'REPLAY') {
    return Math.min(getReplayTimelineMs(feed), feed.finalClockMs)
  }

  return feed.clockMs
}

function getReplayTimelineMs(feed) {
  return Math.max(0, (Date.now() - feed.startedAt) * feed.replaySpeed)
}

function hasReplayLoopFinished(feed) {
  const replayDurationWallMs = Math.ceil(feed.finalClockMs / Math.max(feed.replaySpeed, 1))
  return Date.now() - feed.startedAt >= replayDurationWallMs + REPLAY_LOOP_PAUSE_MS
}

function buildFeedState(feed) {
  return {
    source: feed.source,
    matchId: feed.matchId,
    title: feed.title,
    competition: feed.competition,
    venue: feed.venue,
    clockMs: getRuntimeClockMs(feed),
    startedAt: feed.startedAt,
    streamStatus: feed.streamStatus,
    streamUrl: feed.streamUrl,
    streamSyncSupported: feed.streamSyncSupported,
    posterUrl: feed.posterUrl,
    statusDetail: feed.statusDetail,
    broadcastName: feed.broadcastName,
    homeTeam: feed.homeTeam,
    awayTeam: feed.awayTeam,
    homeScore: feed.homeScore,
    awayScore: feed.awayScore,
    isPlayable: feed.isPlayable,
    eventCount: feed.events.length,
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'moment-hunt-ready/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function fetchLeagueScoreboard(league) {
  const payload = await fetchJson(`${BASE_URL}/${league}/scoreboard`)
  const events = payload?.events ?? []
  const leagueName = payload?.leagues?.[0]?.name ?? league
  const leagueLogo = payload?.leagues?.[0]?.logos?.[0]?.href ?? null

  return events.map((event) => ({
    league,
    leagueName,
    leagueLogo,
    event,
  }))
}

async function loadSportsFeeds() {
  const leagueEvents = (await Promise.all(LEAGUES.map(fetchLeagueScoreboard))).flat()

  const normalizedFeeds = await Promise.all(
    leagueEvents.map(async ({ league, leagueName, leagueLogo, event }) => {
      const competition = event?.competitions?.[0]
      const competitors = competition?.competitors ?? []
      const homeCompetitor = competitors.find((item) => item?.homeAway === 'home') ?? competitors[0] ?? null
      const awayCompetitor = competitors.find((item) => item?.homeAway === 'away') ?? competitors[1] ?? null

      if (!competition || !homeCompetitor || !awayCompetitor) {
        return null
      }

      const summary = await fetchJson(`${BASE_URL}/${league}/summary?event=${event.id}`)
      const events = normalizeEventTimeline(summary)
      const eventState = competition?.status?.type?.state ?? event?.status?.type?.state ?? 'pre'
      const streamStatus = toFeedStatus(eventState, events.length > 0)
      const homeTeam = homeCompetitor?.team?.shortDisplayName ?? homeCompetitor?.team?.displayName ?? 'Home'
      const awayTeam = awayCompetitor?.team?.shortDisplayName ?? awayCompetitor?.team?.displayName ?? 'Away'
      const liveClockMs = toClockMs(competition?.status?.clock ?? event?.status?.clock)
      const statusClockMs = resolveStatusClockMs(
        competition?.status,
        event?.status,
        summary?.header?.competitions?.[0]?.status,
      )
      const finalClockMs = Math.max(events.at(-1)?.eventTimestamp ?? 0, liveClockMs, statusClockMs)
      const playableVideo = pickPlayableVideo(summary)

      return {
        source: 'sports',
        matchId: `espn-${event.id}`,
        title: `${homeTeam} vs ${awayTeam}`,
        competition: leagueName,
        venue: competition?.venue?.fullName ?? event?.venue?.displayName ?? 'Venue TBD',
        clockMs: streamStatus === 'LIVE' ? liveClockMs : 0,
        startedAt: streamStatus === 'LIVE' ? Date.now() - liveClockMs : Date.now(),
        streamStatus,
        streamUrl: playableVideo.streamUrl,
        streamSyncSupported: playableVideo.streamSyncSupported,
        posterUrl:
          playableVideo.posterUrl ??
          buildPosterUrl(homeCompetitor?.team, awayCompetitor?.team, leagueLogo),
        statusDetail:
          competition?.status?.type?.shortDetail ??
          competition?.status?.type?.detail ??
          competition?.status?.type?.description ??
          'Status unavailable',
        broadcastName: buildBroadcastName(competition, summary),
        homeTeam,
        awayTeam,
        homeScore: asNumber(homeCompetitor?.score),
        awayScore: asNumber(awayCompetitor?.score),
        isPlayable: streamStatus === 'LIVE' || streamStatus === 'REPLAY',
        replaySpeed: REPLAY_SPEED,
        finalClockMs,
        events,
      }
    }),
  )

  return normalizedFeeds.filter(Boolean)
}

function loadEsportsFeeds() {
  return ESPORTS_FEEDS.map((feed) => ({
    source: 'esports',
    matchId: `esports-${feed.id}`,
    title: feed.title,
    competition: feed.competition,
    venue: feed.venue,
    clockMs: 0,
    startedAt: Date.now(),
    streamStatus: 'REPLAY',
    streamUrl: feed.streamUrl,
    streamSyncSupported: false,
    posterUrl: feed.posterUrl,
    statusDetail: feed.statusDetail,
    broadcastName: feed.broadcastName,
    homeTeam: feed.homeTeam,
    awayTeam: feed.awayTeam,
    homeScore: feed.homeScore,
    awayScore: feed.awayScore,
    isPlayable: true,
    replaySpeed: ESPORTS_REPLAY_SPEED,
    finalClockMs: Math.max(feed.durationMs, feed.events.at(-1)?.eventTimestamp ?? 0),
    events: feed.events,
  }))
}

async function loadFeeds() {
  const esportsFeeds = loadEsportsFeeds()

  try {
    const sportsFeeds = await loadSportsFeeds()
    return [...sportsFeeds, ...esportsFeeds]
  } catch (error) {
    console.error('[moment-hunt] failed to refresh sports feeds, keeping previous snapshot', error)

    return [
      ...[...runtimeFeeds.values()].filter((feed) => feed.source === 'sports'),
      ...esportsFeeds,
    ]
  }
}

function mergeFeeds(nextFeeds) {
  const nextIds = new Set()

  for (const nextFeed of nextFeeds) {
    nextIds.add(nextFeed.matchId)
    const previous = runtimeFeeds.get(nextFeed.matchId)

    if (!previous) {
      runtimeFeeds.set(nextFeed.matchId, {
        ...nextFeed,
        cursor: 0,
        seenLiveEventIds: new Set(),
      })
      continue
    }

    const merged = {
      ...previous,
      ...nextFeed,
      events: nextFeed.events,
      finalClockMs: nextFeed.finalClockMs,
      replaySpeed: nextFeed.replaySpeed,
    }

    if (nextFeed.streamStatus === 'REPLAY') {
      if (previous.streamStatus !== 'REPLAY') {
        merged.startedAt = Date.now()
        merged.cursor = 0
      } else {
        merged.startedAt = previous.startedAt
        merged.cursor = previous.cursor
      }
    } else if (nextFeed.streamStatus === 'LIVE') {
      merged.startedAt = Date.now() - nextFeed.clockMs
      merged.cursor = 0
      merged.seenLiveEventIds = previous.seenLiveEventIds ?? new Set()
    } else {
      merged.startedAt = Date.now()
      merged.cursor = 0
      merged.seenLiveEventIds = new Set()
    }

    runtimeFeeds.set(nextFeed.matchId, merged)
  }

  for (const existingId of [...runtimeFeeds.keys()]) {
    if (!nextIds.has(existingId)) {
      runtimeFeeds.delete(existingId)
    }
  }
}

function emitLiveEvent(feed, event) {
  notifyListeners({
    type: 'live_event',
    data: {
      id: `${feed.matchId}-${event.id}`,
      source: feed.source,
      matchId: feed.matchId,
      title: feed.title,
      competition: feed.competition,
      eventType: event.eventType,
      eventTimestamp: event.eventTimestamp,
      label: event.label,
      team: event.team,
      streamStatus: feed.streamStatus,
    },
  })
}

function broadcastLiveSummaryEvents(feed) {
  if (feed.streamStatus !== 'LIVE') return

  const seenIds = feed.seenLiveEventIds ?? new Set()
  const nowClockMs = getRuntimeClockMs(feed)

  for (const event of feed.events) {
    if (seenIds.has(event.id) || event.eventTimestamp > nowClockMs) {
      continue
    }

    seenIds.add(event.id)
    emitLiveEvent(feed, event)
  }

  feed.seenLiveEventIds = seenIds
}

async function refreshFeeds() {
  try {
    const nextFeeds = await loadFeeds()
    mergeFeeds(nextFeeds)

    for (const feed of runtimeFeeds.values()) {
      broadcastLiveSummaryEvents(feed)
    }
  } catch (error) {
    console.error('[moment-hunt] failed to refresh feeds', error)
  }
}

function broadcastFeedStates() {
  for (const feed of runtimeFeeds.values()) {
    notifyListeners({ type: 'feed_state', data: buildFeedState(feed) })
  }
}

function tickReplayFeeds() {
  for (const feed of runtimeFeeds.values()) {
    if (feed.streamStatus !== 'REPLAY') {
      continue
    }

    const clockMs = getRuntimeClockMs(feed)

    while (feed.cursor < feed.events.length && feed.events[feed.cursor].eventTimestamp <= clockMs) {
      const event = feed.events[feed.cursor]
      feed.cursor += 1
      emitLiveEvent(feed, event)
    }

    if (hasReplayLoopFinished(feed)) {
      feed.startedAt = Date.now()
      feed.cursor = 0
    }
  }
}

export function subscribeToRealtimePayloads(listener) {
  listeners.add(listener)

  for (const feed of runtimeFeeds.values()) {
    listener({ type: 'feed_state', data: buildFeedState(feed) })
  }

  return () => {
    listeners.delete(listener)
  }
}

export async function ensureRealtimeRuntimeStarted() {
  if (runtimeStarted) {
    return startPromise ?? Promise.resolve()
  }

  runtimeStarted = true
  console.log('[moment-hunt] realtime runtime started')

  startPromise = (async () => {
    await refreshFeeds()

    setInterval(broadcastFeedStates, FEED_BROADCAST_MS)
    setInterval(tickReplayFeeds, REPLAY_TICK_MS)
    setInterval(refreshFeeds, FEED_REFRESH_MS)
  })()

  return startPromise
}
