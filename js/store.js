/* Local-first persistence. Everything the user does lands here instantly —
   the app never "loses its stuff", online or offline.
   Profile + saves travel between devices via a Sync Code (see below): the
   brief's "logged in, follows them around" without any account system. */

const Store = (() => {
  const KEY = 'pulse.v1';

  const defaults = () => ({
    profile: null,            // { id, name, emoji } — this IS "being logged in"
    friends: null,            // null = not seeded yet; [{id, name, emoji, seed?}]
    saved: [],                // spot ids
    custom: [],               // user-dropped finds (full spot objects)
    feed: [],                 // cached live-activity feed (works as history offline)
    feedTs: null,             // when the feed last updated
    manualOffline: false,     // presenter's "simulate offline" switch
    theme: 'auto',            // 'auto' | 'light' | 'dark'
    locId: 'diac',
    myLoc: null,              // last geolocation fix { lat, lng }
  });

  let state = defaults();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? Object.assign(defaults(), JSON.parse(raw)) : defaults();
    } catch (e) {
      // Corrupt or unavailable storage — start fresh rather than crash.
      state = defaults();
    }
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ }
  }

  function toggleSaved(id) {
    const i = state.saved.indexOf(id);
    if (i >= 0) state.saved.splice(i, 1); else state.saved.push(id);
    save();
    return i < 0; // true when it was just saved
  }
  const isSaved = (id) => state.saved.includes(id);

  function addCustom(spot) { state.custom.push(spot); save(); }

  /* ——— Friends (no accounts — see Friend Codes below) ———
     Five demo friends ship pre-added so the app feels alive; real people
     are added by swapping Friend Codes. */
  const SEED_FRIENDS = [
    { id: 'f1', name: 'Ayesha', emoji: '🦊', seed: true },
    { id: 'f2', name: 'Zara',   emoji: '🐼', seed: true },
    { id: 'f3', name: 'Maya',   emoji: '🦋', seed: true },
    { id: 'f4', name: 'Omar',   emoji: '🐯', seed: true },
    { id: 'f5', name: 'Lina',   emoji: '🦉', seed: true },
  ];

  function ensureFriends() {
    if (!Array.isArray(state.friends)) { state.friends = SEED_FRIENDS.map((f) => ({ ...f })); save(); }
    return state.friends;
  }
  function ensureProfileId() {
    if (state.profile && !state.profile.id) {
      state.profile.id = 'u' + Math.random().toString(36).slice(2, 10);
      save();
    }
  }
  function addFriend(f) {
    ensureFriends();
    if (state.profile && f.id === state.profile.id) throw new Error("That's your own code!");
    if (state.friends.some((x) => x.id === f.id)) throw new Error(`${f.name} is already your friend.`);
    state.friends.push({ id: f.id, name: f.name, emoji: f.emoji });
    save();
  }
  function removeFriend(id) {
    ensureFriends();
    state.friends = state.friends.filter((f) => f.id !== id);
    save();
  }
  const isFriend = (id) => Array.isArray(state.friends) && state.friends.some((f) => f.id === id);

  /* Friend Code: your identity as a tiny shareable token — like the Sync
     Code, but just {id, name, emoji}. Swap codes, become friends. */
  const FMAGIC = 'PULSEF.';
  function exportFriendCode() {
    ensureProfileId();
    const p = state.profile || {};
    const json = JSON.stringify({ i: p.id, n: p.name, e: p.emoji });
    return FMAGIC + btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  }
  function importFriendCode(code) {
    code = (code || '').trim();
    if (!code.startsWith(FMAGIC)) throw new Error('That does not look like a Friend Code.');
    const bytes = Uint8Array.from(atob(code.slice(FMAGIC.length)), (ch) => ch.charCodeAt(0));
    const p = JSON.parse(new TextDecoder().decode(bytes));
    if (!p.i || !p.n) throw new Error('That Friend Code is missing its name.');
    const friend = { id: p.i, name: String(p.n).slice(0, 20), emoji: p.e || '🙂' };
    addFriend(friend);
    return friend;
  }

  function pushFeed(activity) {
    state.feed.unshift(activity);
    if (state.feed.length > 40) state.feed.length = 40;
    state.feedTs = Date.now();
    save();
  }

  /* ——— Sync Code: the whole "account" in your pocket ———
     Encodes profile + saves + dropped finds as a compact base64 token.
     Paste it on any device to carry your stuff with you. No password,
     no server, nothing to breach. */
  const MAGIC = 'PULSE1.';

  function exportCode() {
    ensureProfileId();
    const payload = { p: state.profile, s: state.saved, c: state.custom, f: state.friends };
    const json = JSON.stringify(payload);
    return MAGIC + btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  }

  function importCode(code) {
    code = (code || '').trim();
    if (!code.startsWith(MAGIC)) throw new Error('That does not look like a Pulse Sync Code.');
    const bytes = Uint8Array.from(atob(code.slice(MAGIC.length)), (ch) => ch.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.p) state.profile = payload.p;
    for (const id of payload.s || []) if (!state.saved.includes(id)) state.saved.push(id);
    for (const c of payload.c || []) if (!state.custom.some((x) => x.id === c.id)) state.custom.push(c);
    if (Array.isArray(payload.f)) {
      ensureFriends();
      for (const f of payload.f) if (!state.friends.some((x) => x.id === f.id)) state.friends.push(f);
    }
    save();
  }

  return {
    load, save,
    get state() { return state; },
    toggleSaved, isSaved, addCustom, pushFeed,
    exportCode, importCode,
    ensureFriends, ensureProfileId, addFriend, removeFriend, isFriend,
    exportFriendCode, importFriendCode,
  };
})();
