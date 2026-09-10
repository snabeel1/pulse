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
  let handlers = { activity: [], net: [], chat: [], typing: [] };

  const on = (ev, fn) => handlers[ev].push(fn);
  const emit = (ev, data) => handlers[ev].forEach((fn) => fn(data));

  const isOnline = () => navigator.onLine && !Store.state.manualOffline;

  function init() {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('pulse-live-v1');
      channel.onmessage = (msg) => {
        const { t, a, m, from } = msg.data || {};
        if (from === clientId) return;
        if (!isOnline()) return; // offline means offline — even cross-tab
        const myId = Store.state.profile?.id;
        if (t === 'activity' && a) {
          // Friends-only feed: ignore strangers. Your own profile id on another
          // device still gets through (that's you, elsewhere).
          if (a.who?.id !== myId && !Store.isFriend(a.who?.id)) return;
          if (a.who?.id === myId) a.elsewhere = true;
          receive(a);
        } else if (t === 'chat' && m) {
          receiveChat(m);
        }
      };
    }
    window.addEventListener('online', netChanged);
    window.addEventListener('offline', netChanged);
    if (isOnline()) scheduleSim(4000); // first ambient ping arrives quickly for the demo
  }

  function netChanged() {
    emit('net', isOnline());
    if (isOnline()) { scheduleSim(3000); flushOutbox(); } else stopSim();
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

  /* ——— Chat: same broadcast bus, plus an offline outbox ———
     Messages queue while offline and flush the moment you reconnect —
     texting "just works" through dead spots. Seeded demo friends reply
     with a typing indicator, so the room talks back even solo. */
  const REPLIES = [
    'omg yes I was just there 😍', "wait really? I'm 5 min away",
    'say less, otw 🏃', 'take me next time!!', "that place is SO underrated",
    'haha classic you', 'send pics or it never happened 📸',
    'ok adding it to my list', 'meet at {spot}? heard it\'s buzzing rn',
    'I found something better, check {spot} 👀',
  ];

  function sendChat(friendId, text) {
    Store.ensureProfileId();
    const me = Store.state.profile;
    const msg = {
      id: 'm' + Date.now() + Math.random().toString(36).slice(2, 6),
      fromId: me.id, fromName: me.name, fromEmoji: me.emoji,
      toId: friendId, text, ts: Date.now(),
    };
    const local = { id: msg.id, from: 'me', text, ts: msg.ts };
    if (!isOnline()) {
      local.pending = true;
      Store.state.outbox.push(msg);
    }
    Store.pushMsg(friendId, local);
    Store.save();
    if (isOnline()) deliver(msg);
    return local;
  }

  function deliver(msg) {
    if (channel) channel.postMessage({ t: 'chat', from: clientId, m: msg });
    const friend = Store.ensureFriends().find((f) => f.id === msg.toId);
    if (friend?.seed) scheduleReply(friend);
  }

  function flushOutbox() {
    const queued = Store.state.outbox.splice(0);
    if (!queued.length) return;
    for (const msg of queued) {
      const thread = Store.chatWith(msg.toId);
      const local = thread.find((m) => m.id === msg.id);
      if (local) delete local.pending;
      deliver(msg);
    }
    Store.save();
    emit('chat', { flushed: queued.length });
  }

  function receiveChat(m) {
    const myId = Store.state.profile?.id;
    if (m.fromId === myId) {
      // me, on another device — converge the thread
      if (Store.pushMsg(m.toId, { id: m.id, from: 'me', text: m.text, ts: m.ts }))
        emit('chat', { friendId: m.toId });
      return;
    }
    if (m.toId !== myId || !Store.isFriend(m.fromId)) return;
    if (Store.pushMsg(m.fromId, { id: m.id, from: 'them', text: m.text, ts: m.ts })) {
      emit('chat', { friendId: m.fromId, incoming: true, name: m.fromName, emoji: m.fromEmoji, text: m.text });
    }
  }

  function scheduleReply(friend) {
    setTimeout(() => {
      if (!isOnline() || !Store.isFriend(friend.id)) return;
      emit('typing', { friendId: friend.id, on: true });
      setTimeout(() => {
        emit('typing', { friendId: friend.id, on: false });
        if (!isOnline() || !Store.isFriend(friend.id)) return;
        const pool = (window.App && App.getSpots()) || SPOTS;
        const spot = pool[Math.floor(Math.random() * pool.length)];
        const text = REPLIES[Math.floor(Math.random() * REPLIES.length)]
          .replace('{spot}', `${spot.emoji} ${spot.name}`);
        const msg = { id: 'm' + Date.now() + Math.random().toString(36).slice(2, 6), from: 'them', text, ts: Date.now() };
        if (Store.pushMsg(friend.id, msg))
          emit('chat', { friendId: friend.id, incoming: true, name: friend.name, emoji: friend.emoji, text });
      }, 1600 + Math.random() * 2600);
    }, 900 + Math.random() * 1200);
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

  return { init, on, isOnline, setManualOffline, localActivity, netChanged, sendChat };
})();
