# Pulse — pitch material

## The 60-second feature pitch

> "Pulse answers one question: **what's good around me, right now?**
>
> Open it — no signup, no password, you just pick a name. The feed ranks what's
> *actually happening*: live events first, then what's open, weighted by distance —
> with real 4K photos of the real places, and covers our own code draws for the rest.
>
> **Search anywhere** — type 'Hatta', type 'Deira', type any place on the planet —
> Pulse teleports you there and shows distinct events going on in that exact spot.
>
> It's **social**: your circle of friends lives in the app — added by swapping Friend
> Codes, no phone numbers — their discoveries ping your radar live, and you can
> **text them** right here. Go through a dead zone? Messages queue and send
> themselves when you're back.
>
> And that's the headline: **flip it to airplane mode and everything still works** —
> the feed, the radar, your saves, your chat history. Offline-first core, live layer
> on top, identity without accounts. Every contradiction in the brief became a feature.
> That's Pulse."

---

# Pulse — 3-minute demo script

> Goal: hit all five judging criteria — Interpretation, Functionality, Technical execution,
> Creativity, Presentation — in one continuous story.

## 0:00 — Frame the broken brief (Interpretation)
"The brief asks for an app that works with **no signal** but also shows **live friend updates** —
and wants saved lists that **follow you around** with **no accounts**. Those sound like
contradictions. We treated them as a layering problem: an **offline-first core** with a
**live layer on top**, and **identity without accounts**."

## 0:30 — The Now feed (Functionality)
- Open the app. Onboarding: pick a name + emoji. *"That's the entire login. No email, no password."*
- Feed shows what's **happening right now** — live events first, then open places, ranked by
  time + distance. Point out "Closes soon" / "LIVE" badges.
- Tap the 📍 chip → switch between DIAC / Downtown / Marina / real GPS. Feed re-ranks instantly.

## 1:00 — The kill shot: go offline (Interpretation + Creativity)
- Click the green **LIVE** pill → it flips to **OFFLINE** (or use real airplane mode — the
  service worker means even a full refresh still loads).
- Browse the feed, open the **Radar** — everything still works. *"No map tiles, no API,
  pure math — every spot as a blip by true bearing and distance."*
- Save a spot while offline. *"Saves land in device storage instantly — it never loses its stuff."*

## 1:45 — Go back online: the live layer wakes up (Functionality + Creativity)
- Flip back to LIVE. Ambient friend activity starts arriving as toasts + pink radar pings.
- **The real-time proof:** second tab (or teammate's laptop on the deployed link) → drop a find
  with the ＋ button → it appears in the first tab **live**. *"This is a real broadcast bus —
  BroadcastChannel today, WebSockets in production, same UI code."*

## 2:30 — Sync Code (Interpretation)
- Profile → **Copy my Sync Code** → paste into a fresh incognito window → profile + saves appear.
- *"The brief said saved lists should follow you around, but also no fancy account system.
  So identity is a token you own, not a row in our database."*

## 2:50 — Close
"Offline-first core, live when it can be, identity without accounts —
every contradiction in the brief became a feature. That's Pulse."

## Q&A ammo
- **Why no map?** Map tiles need a network + API keys — the radar is 100% offline and more fun.
- **Is the friend activity fake?** The ambient friends are seeded (labelled in code); the
  cross-tab updates are genuinely real-time. The transport is swappable — that was the point.
- **Security?** Nothing sensitive leaves the device; the Sync Code contains only what you'd
  see on screen. XSS-escaped rendering throughout.
- **Scaling?** Swap BroadcastChannel for a WebSocket room keyed by geohash; spots move from
  a seed file to any places API. UI untouched.
