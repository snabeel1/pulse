/* The live layer — a progressive enhancement on top of the offline core.
   Transport-agnostic by design: today it runs on BroadcastChannel (genuinely
   real-time between open tabs/windows — perfect for a two-phone-style demo)
   plus seeded ambient friend activity. A WebSocket backend can replace
   `channel` without touching any UI code.
   When the network drops, this whole layer pauses gracefully; the rest of
   the app never notices. */

const Live = (() => {
  const VERBS = ['found', 'is vibing at', 'just saved', 'spotted a deal at', 'is heading to'];

  const clientId = 'c' + Math.random().toString(36).slice(2); // per-tab, so same profile in 2 tabs still syncs
  let channel = null;
  let simTimer = null;
  let handlers = { activity: [], net: [] };

  const on = (ev, fn) => handlers[ev].push(fn);
  const emit = (ev, data) => handlers[ev].forEach((fn) => fn(data));

  const isOnline = () => navigator.onLine && !Store.state.manualOffline;

  function init() {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('pulse-live-v1');
      channel.onmessage = (msg) => {
        const { t, a, from } = msg.data || {};
        if (t !== 'activity' || from === clientId) return;
        if (!isOnline()) return; // offline means offline — even cross-tab
        // Friends-only feed: ignore strangers. Your own profile id on another
        // device still gets through (that's you, elsewhere).
        const myId = Store.state.profile?.id;
        if (a.who?.id !== myId && !Store.isFriend(a.who?.id)) return;
        if (a.who?.id === myId) a.elsewhere = true;
        receive(a);
      };
    }
    window.addEventListener('online', netChanged);
    window.addEventListener('offline', netChanged);
    if (isOnline()) scheduleSim(4000); // first ambient ping arrives quickly for the demo
  }

  function netChanged() {
    emit('net', isOnline());
    if (isOnline()) scheduleSim(3000); else stopSim();
  }

  function setManualOffline(v) {
    Store.state.manualOffline = v;
    Store.save();
    netChanged();
  }

  function receive(activity) {
    Store.pushFeed(activity);
    emit('activity', activity);
  }

  /* Called by the app when THIS user does something shareable. */
  function localActivity(verb, spot) {
    Store.ensureProfileId();
    const me = Store.state.profile || { name: 'Someone', emoji: '🙂' };
    const a = {
      id: 'a' + Date.now() + Math.random().toString(36).slice(2, 6),
      who: { id: me.id, name: me.name, emoji: me.emoji },
      spotId: spot.id, spotName: spot.name, spotEmoji: spot.emoji,
      verb, ts: Date.now(), mine: true,
    };
    Store.pushFeed(a);
    emit('activity', a);
    if (channel && isOnline()) {
      // Broadcast a copy the other tab will render as a friend's discovery.
      channel.postMessage({ t: 'activity', from: clientId, a: { ...a, mine: false } });
    }
  }

  /* Ambient friend activity — seeded peers so the room feels alive even solo.
     Honest label: production swaps this for real presence over WebSockets. */
  function scheduleSim(delay) {
    stopSim();
    simTimer = setTimeout(simTick, delay ?? 15000 + Math.random() * 20000);
  }
  function stopSim() { if (simTimer) { clearTimeout(simTimer); simTimer = null; } }

  function simTick() {
    if (!isOnline()) return;
    // Ambient activity comes only from the seeded demo friends — remove them
    // from your friends list and their chatter stops, like real people would.
    const seeds = Store.ensureFriends().filter((f) => f.seed);
    if (!seeds.length) return;
    const friend = seeds[Math.floor(Math.random() * seeds.length)];
    const pool = (window.App && App.getSpots()) || SPOTS;
    const spot = pool[Math.floor(Math.random() * pool.length)];
    receive({
      id: 'a' + Date.now() + Math.random().toString(36).slice(2, 6),
      who: { id: friend.id, name: friend.name, emoji: friend.emoji },
      spotId: spot.id, spotName: spot.name, spotEmoji: spot.emoji,
      verb: VERBS[Math.floor(Math.random() * VERBS.length)],
      ts: Date.now(), mine: false, sim: true,
    });
    scheduleSim();
  }

  return { init, on, isOnline, setManualOffline, localActivity, netChanged };
})();
