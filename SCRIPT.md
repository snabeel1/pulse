# Pulse — Presentation Script (word-for-word)

**Target: ~4 minutes talking + demo beats. One presenter (P1) + one teammate (P2) on the deployed link.**
**Before you start:** open Pulse on your phone (airplane mode OFF for now), P2 opens pulse-dubai.vercel.app on their laptop, both already onboarded as different profiles and added as friends via Friend Codes.

---

## Slide 1 — Title *(20 sec)*

*[Don't introduce yourself yet. Hold your phone up.]*

> "Before I say anything — this phone is about to lose the internet. Keep that in mind.
> We're Team [NAME], and this is **Pulse** — every city has a pulse, and we built the app that lets you see it."

## Slide 2 — The Broken Brief *(35 sec)*

> "The brief we got looks innocent, but read it twice and it's a minefield.
> It wants an app that quote — *works great even with no signal* — but ALSO shows *live updates when friends nearby find something cool*. That's an offline app that's also real-time.
> It wants your saved list to *follow you around* — but with *no fancy accounts system*. That's cross-device sync with nothing to log into.
> And it all has to be doable in a weekend and never lose your stuff.
> We didn't treat these as bugs in the brief. We treated them as the spec."

## Slide 3 — Contradictions → Architecture *(30 sec)*

> "Our whole interpretation fits in three lines.
> **One:** the core of the app — the feed, the radar, your saves, even your chat history — is offline-first. It lives on the device.
> **Two:** the live social layer sits *on top* — it wakes up when you're online, and pauses gracefully when you're not.
> **Three:** identity without accounts — logging in means picking a name and an emoji. Codes replace passwords.
> In short: every contradiction in the brief became a feature."

## Slide 4 — Meet Pulse *(25 sec)*

> "So here's Pulse. A feed of what's happening *right now* — live events first, then what's open, ranked by time AND distance, with prices and walk times.
> A radar that plots every spot by real bearing and distance — pure math, no map tiles, no API keys.
> Friends, chat, saved spots, a search bar that works for any place on Earth, and a button to drop your own find and ping everyone near you.
> Let me show you the two moments that matter."

## Slide 5 — DEMO 1: Airplane mode *(45 sec)*

*[Flip airplane mode ON. Hold the phone so they see it. Refresh the page.]*

> "Airplane mode is on. No wifi, no data — and I just *refreshed the page*.
> It loads. The feed still ranks tonight's events. The radar still sweeps.
> *[Save a spot.]* I just saved this café — that's persisted on the device, it will never be lost.
> *[Open a chat, type a message.]* I'm even texting my teammate right now — see the little 'queued' badge? Remember it. A service worker caches the entire app, and every action lands in device storage the moment it happens.
> The brief said 'works great with no signal.' This is what we think that means."

## Slide 6 — DEMO 2: The live layer *(40 sec)*

*[Flip airplane mode OFF. Wait 2 seconds.]*

> "Now watch what happens when the signal comes back.
> *[Point:]* That message I typed in the dead zone? It just sent itself. Nothing lost, nothing to retry.
> [P2's name], drop a find. *[P2 hits ＋ on their laptop, drops 'Secret shawarma cart'.]*
> *[Your phone toasts it live.]* That came from their machine to mine in real time — a genuine broadcast bus, not a mockup. Today it runs on BroadcastChannel; in production the same UI plugs into WebSockets.
> And it's friends-only: we verified strangers' messages get dropped at the transport layer."

## Slide 7 — Identity without accounts *(25 sec)*

> "How are we friends without accounts? Codes.
> My whole 'account' — profile, saves, friends — is this one string. Paste it into Pulse on any device and my stuff follows me around, exactly like the brief asked.
> And this shorter one is my Friend Code — [P2] and I swapped these before the demo. No phone numbers, no passwords, nothing to breach."

## Slide 8 — Design & craft *(25 sec)*

> "Some craft we're proud of: a real light mode and dark mode, not just an inversion — even the radar canvas re-themes itself.
> Real landmarks get real 4K photos, served locally so offline still works.
> And every other cover is *drawn by our own code* — a little SVG art engine with six Dubai scenes in four times of day, seeded per spot. Zero stock photos. Our covers are code."

## Slide 9 — How we vibe-coded it *(30 sec)*

> "The process, honestly: we read the brief and wrote our assumptions down *before* writing code. We chose boring-on-purpose tech — no backend, no build step — because the deadline was the spec too.
> We pair-built with AI, but the part we're being judged on is the part AI can't do alone: we tested like judges. Offline reloads with the server literally killed. Real-time across two machines. Sync codes on a wiped profile.
> Ship early: everything's on GitHub, deployed twice over."

## Slide 10 — By the numbers *(15 sec)*

> "The receipts: zero backend servers, zero build steps, zero passwords. Thirty-two curated spots, infinite searchable places — type 'Hatta' and Pulse will show you what's going on there. Eighteen landmarks in 4K. Three ways to reach the demo."

## Slide 11 — Close *(15 sec)*

> "Offline-first core. Live layer on top. Identity without accounts.
> Every contradiction in the brief became a feature.
> Lose the signal — keep the city. **That's Pulse.**
> The QR is live right now — scan it and it's on your phone."

*[Leave slide 11 up for Q&A.]*

---

## If things go wrong

- **Venue wifi dies:** perfect — that IS the demo. Say "and this is exactly why we built it offline-first," keep going on cached data.
- **Deployed link down:** localhost fallback is allowed by the rules; `npx serve .` in the repo folder.
- **Projector dies:** the whole pitch works phone-in-hand; slides are a bonus.
- **Live drop doesn't appear:** both devices must be online and friends; retry once, else show the Friends feed history — the earlier events are cached and timestamped.

## Q&A ammo

- **"Is the friend activity fake?"** — The five demo friends are seeded and labeled in code. The cross-device updates and chat are genuinely real-time — we just demoed them. The transport swaps to WebSockets without UI changes.
- **"Why no map?"** — Map tiles need a network and API keys. The radar is 100% offline, and honestly more fun.
- **"What about security?"** — Nothing sensitive leaves the device. A Sync Code only contains what you can already see on screen. All rendering is XSS-escaped.
- **"How would this scale?"** — WebSocket rooms keyed by geohash for presence; spots move from a seed file to a places/events API; the offline architecture doesn't change at all.
- **"What did AI do vs you?"** — AI wrote code fast; we made the calls: the interpretation, the architecture, what to test, what to cut. Every feature was verified in a real browser before it shipped.
