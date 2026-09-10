# Pulse — what's good around you, right now ⚡

Offline-first city discovery with a live friend layer. Vanilla HTML/CSS/JS PWA — no build step.
**Run:** any static server (`npx serve .`) or the deployed link. **Demo tip:** open two tabs and save a spot in one.

## Key assumptions (how we resolved the brief)

1. **"Works with no signal" vs "live friend updates"** → these aren't contradictory, they're *layers*. The core (feed, radar, saves) is offline-first: service worker caches the app, data lives on-device. The live social layer is a progressive enhancement that activates when online and pauses gracefully when not. Try the OFFLINE switch in the header.
2. **"Saved list follows them around" vs "no fancy accounts"** → "logged in" = a passwordless local profile (name + emoji). A portable **Sync Code** carries profile + saves to any device. No server, no signup, nothing to breach — swappable for real auth later.
3. **"Around them right now"** → the feed ranks by *time* (open now, live events, closing soon) and *distance*, not just proximity.
4. **Friend updates** are transport-agnostic: demo uses BroadcastChannel (genuinely real-time across tabs) plus seeded ambient activity; a WebSocket backend drops in without UI changes.
5. **"Doesn't lose its stuff"** → every action persists to device storage instantly.
