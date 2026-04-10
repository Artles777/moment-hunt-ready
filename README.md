# Moment Hunt — test task MVP

Realtime MVP игры, где пользователь пытается поймать момент события в спортивной или киберспортивной трансляции.

## Что уже есть

- 2 режима: `sports` и `esports`
- единая игровая механика для обоих режимов
- WebSocket feed вместо захардкоженной логики событий в UI
- sidebar со списком доступных трансляций для текущего режима
- для `sports` матчи и события приходят из реального scoreboard/summary API
- для `esports` доступны симулированные demo-feed трансляции с тем же нормализованным event schema
- playable video зависит от того, отдаёт ли upstream API embed/direct stream URL
- scoring по точности попадания
- leaderboard c сохранением в `localStorage`
- один экран для короткого демо

## Архитектура

- `app/page.tsx` — orchestration-слой экрана: game state, selected feed, video state, wiring realtime/hooks
- `components/moment-hunt/*` — product-specific UI-модули: header, broadcasts, video hero, game panel, right rail
- `lib/moment-hunt/types.ts` — нормализованные типы feed/event/game state
- `lib/moment-hunt/scoring.ts` — scoring и leaderboard-константы
- `lib/moment-hunt/format.ts` — форматирование clock/status/event labels
- `lib/moment-hunt/stream-source.ts` — нормализация video/embed URL
- `hooks/use-moment-hunt-realtime.ts` — WebSocket client, feed_state/live_event ingestion
- `server/realtime-server.mjs` — локальный WebSocket server, который тянет реальные soccer matches, добавляет simulated esports feeds, шлёт `feed_state` и нормализованные `live_event`
- один нормализованный формат событий для sport и esports

## Как запустить

```bash
npm install
npm run dev
```

После этого открой:

- http://localhost:3000 — приложение
- ws://localhost:3001 — realtime feed

## Как работает

1. Поднимается Next.js frontend.
2. Поднимается отдельный локальный WebSocket server.
3. Сервер тянет реальные sports-матчи из внешнего scoreboard feed и summary endpoint, а для `esports` подмешивает simulated demo feeds.
4. Сервер нормализует все источники в `feed_state`, а key events rebroadcast'ит как `live_event`.
5. UI строит sidebar трансляций из этих `feed_state`, а не из локального конфига страницы.
6. UI не знает будущих событий заранее — он только получает их по WebSocket.
7. Если upstream API не даёт playable stream URL, UI честно показывает broadcast/channel metadata без встроенного видео.
8. Пользователь жмёт `Catch`, система сравнивает `guess timestamp` и `event timestamp`, после чего начисляет очки.

## Что говорить на демо

- MVP сознательно разделён на слой показа трансляции, слой событий и игровую логику.
- Оба режима используют один и тот же event schema.
- `sports` показывает реальные upstream sports events, `esports` сейчас работает как явно помеченный simulated demo feed.
- Для тестового важнее рабочий игровой цикл и realtime delivery, чем полноценный video ingestion.
- Следующий шаг — добавить реальный esports source рядом с уже существующим sports polling.

## Следующий шаг, если захочешь усилить

- подключить реальный football events API на сервере
- добавить выбор конкретного матча
- вынести leaderboard в Supabase
- сделать короткое видео-демо на 60–90 секунд
