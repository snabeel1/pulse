# Pulse — what's good around you, right now ⚡

Offline-first city discovery with a live social layer: a time-aware feed, an offline radar, friend chat, and search-anywhere teleporting. Vanilla JS PWA, no build step.
Covers are 4K landmark photos (Wikimedia, served locally — see IMAGE_CREDITS.md) over SVG scene art our code draws for everything else.
**Run:** any static server (`npx serve .`) or the deployed link. **Demo tip:** open two tabs — saves, drops, and chats sync live.

## Key assumptions (how we resolved the brief)

1. **"No signal" vs "live friend updates"** → layers, not a contradiction. The core (feed, radar, saves, chat history) is cached and offline-first; the live layer (friend activity, texting, map search) activates when online and pauses gracefully. Chat messages queue offline and auto-send on reconnect. Try the OFFLINE switch.
2. **"Saved list follows them around" vs "no accounts"** → a passwordless local profile plus portable **Sync Codes**; **Friend Codes** add real friends the same way. The live feed and chat are friends-only.
3. **"Around them right now"** → ranked by open-now/live-events *and* distance; search any place on Earth and Pulse shows distinct happenings there.
4. **Transport-agnostic realtime**: BroadcastChannel today (genuinely live across tabs), WebSockets tomorrow — same UI.
5. **"Doesn't lose its stuff"** → every action persists to device storage instantly.
