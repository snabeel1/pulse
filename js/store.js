/* Local-first persistence. Everything the user does lands here instantly —
   the app never "loses its stuff", online or offline.
   Profile + saves travel between devices via a Sync Code (see below): the
   brief's "logged in, follows them around" without any account system. */

const Store = (() => {
  const KEY = 'pulse.v1';

  const defaults = () => ({
    profile: null,            // { name, emoji } — this IS "being logged in"
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
    const payload = { p: state.profile, s: state.saved, c: state.custom };
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
    save();
  }

  return {
    load, save,
    get state() { return state; },
    toggleSaved, isSaved, addCustom, pushFeed,
    exportCode, importCode,
  };
})();
