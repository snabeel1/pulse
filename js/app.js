/* Pulse — what's good around you, right now.
   Offline-first core (feed, radar, saves) + live social layer when online. */

const App = (() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  let demoEvents = [];
  let localPopups = [];                 // distinct events seeded around the current location
  let loc = null;                       // { lat, lng, label }
  let filter = 'all';
  let nowOnly = true;
  let view = 'now';
  let geoCache = [];                    // [{ spot, dist(km), bearing(rad), saved }]
  let maxRange = 10;

  /* ——— Geo math ——— */
  const toRad = (d) => (d * Math.PI) / 180;
  function distKm(a, b) {
    const R = 6371;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  function bearingRad(a, b) {
    const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
    const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
      Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
    return Math.atan2(y, x);
  }
  const fmtDist = (km) => km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  const travelTime = (km) => km <= 2.5
    ? `🚶 ${Math.max(1, Math.round((km * 1000) / 80))} min`
    : `🚗 ${Math.max(2, Math.round((km / 40) * 60))} min`;

  /* ——— Time-aware status ——— */
  const nowH = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  function within(h, open, close) {
    return open <= close ? (h >= open && h < close) : (h >= open || h < close);
  }
  function fmtHour(x) {
    const h = Math.floor(x) % 24, m = Math.round((x - Math.floor(x)) * 60);
    const ap = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return m ? `${hh}:${String(m).padStart(2, '0')} ${ap}` : `${hh} ${ap}`;
  }
  function statusOf(spot) {
    const h = nowH();
    if (spot.event && within(h, spot.event.start, spot.event.end))
      return { cls: 'live', label: `⚡ LIVE · ${spot.event.title}`, order: 0 };
    if (spot.event) {
      let dt = spot.event.start - h; if (dt < 0) dt += 24;
      if (dt <= 1.5 && within(h, spot.hours[0], spot.hours[1]))
        return { cls: 'soon', label: `🎟 ${spot.event.title} at ${fmtHour(spot.event.start)}`, order: 1 };
    }
    const [open, close] = spot.hours;
    if (within(h, open, close)) {
      let left = close - h; if (left < 0) left += 24;
      if (open === 0 && close === 24) return { cls: 'open', label: 'Open 24h', order: 2 };
      if (left <= 1) return { cls: 'soon', label: `⏳ Closes ${fmtHour(close)}`, order: 2 };
      return { cls: 'open', label: `Open · till ${fmtHour(close)}`, order: 2 };
    }
    let until = open - h; if (until < 0) until += 24;
    if (until <= 1.5) return { cls: 'soon', label: `Opens ${fmtHour(open)}`, order: 3 };
    return { cls: 'closed', label: `Closed · opens ${fmtHour(open)}`, order: 4 };
  }

  /* ——— Theme (auto → light → dark) ——— */
  const Theme = (() => {
    const mq = matchMedia('(prefers-color-scheme: light)');
    const ICONS = { auto: '🌓', light: '☀️', dark: '🌙' };
    const resolve = (pref) => (pref === 'light' || pref === 'dark') ? pref : (mq.matches ? 'light' : 'dark');
    function apply() {
      const pref = Store.state.theme || 'auto';
      const t = resolve(pref);
      document.documentElement.dataset.theme = t;
      document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', t === 'light' ? '#eef1f7' : '#070b14');
      const btn = $('#themeBtn');
      if (btn) {
        btn.textContent = ICONS[pref];
        btn.title = pref === 'auto' ? 'Theme: Auto (follows system)' : `Theme: ${pref[0].toUpperCase() + pref.slice(1)}`;
      }
      window.dispatchEvent(new CustomEvent('themechange'));
    }
    function cycle() {
      const order = ['auto', 'light', 'dark'];
      const next = order[(order.indexOf(Store.state.theme || 'auto') + 1) % order.length];
      Store.state.theme = next; Store.save();
      apply();
      toast(next === 'auto' ? '🌓 Auto theme — follows your system'
        : next === 'light' ? '☀️ Light mode' : '🌙 Dark mode');
    }
    mq.addEventListener('change', () => { if ((Store.state.theme || 'auto') === 'auto') apply(); });
    return { apply, cycle };
  })();

  /* ——— Greeting ——— */
  function renderHello() {
    const h = new Date().getHours();
    const greet = h < 5 ? 'Late-night wander' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Tonight’s calling';
    const name = Store.state.profile?.name;
    $('#helloTitle').textContent = name ? `${greet}, ${name} 👋` : `${greet} 👋`;
    $('#helloSub').textContent = `Here's what's alive near ${loc?.label || 'you'} right now.`;
  }

  const fmtAgo = (ts) => {
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  /* ——— Data ——— */
  const getSpots = () => [...SPOTS, ...demoEvents, ...localPopups, ...Store.state.custom];
  const findSpot = (id) => getSpots().find((s) => s.id === id);

  function recomputeGeo() {
    geoCache = getSpots().map((spot) => ({
      spot,
      dist: distKm(loc, spot),
      bearing: bearingRad(loc, spot),
      saved: Store.isSaved(spot.id),
    })).sort((a, b) => a.dist - b.dist);
    const d = geoCache.map((g) => g.dist);
    maxRange = Math.min(40, Math.max(1.5, (d[Math.min(d.length - 1, 9)] || 10) * 1.15));
  }
  const radarData = () => ({ spots: geoCache, maxRange });

  /* ——— Views ——— */
  function setView(v) {
    view = v;
    $$('.view').forEach((el) => el.classList.toggle('active', el.id === 'view-' + v));
    $$('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
    $('#fab').hidden = !(v === 'now' || v === 'radar');
    if (v === 'radar') { Radar.resize(); Radar.start(); } else Radar.stop();
    if (v === 'friends') { $('#liveDot').hidden = true; renderFriends(); }
    if (v === 'saved') renderSaved();
    if (v === 'now') renderFeed();
  }

  /* ——— Feed ——— */
  function cardHTML(g) {
    const { spot, dist } = g;
    const st = statusOf(spot);
    const cat = CATEGORIES[spot.cat];
    return `
      <article class="card" data-id="${spot.id}">
        <div class="cover">
          ${Covers.coverSVG(spot)}
          ${spot.img ? `<img class="cover-img" src="${spot.img}" alt="" loading="lazy" onerror="this.remove()">` : ''}
          <span class="cover-chip">${cat.emoji} ${cat.label}</span>
          ${st.cls === 'live' ? '<span class="cover-live">⚡ LIVE</span>' : ''}
          <button class="heart cover-heart ${g.saved ? 'on' : ''}" data-save="${spot.id}"
            aria-label="${g.saved ? 'Unsave' : 'Save'} ${esc(spot.name)}">${g.saved ? '♥' : '♡'}</button>
        </div>
        <div class="card-body">
          <div class="meta-top">
            <span class="area">📍 ${esc(spot.area || 'Nearby')} · ${fmtDist(dist)} · ${travelTime(dist)}</span>
            <span class="price">${esc(spot.price || '')}</span>
          </div>
          <h3>${esc(spot.name)}</h3>
          <p class="vibe">${esc(spot.vibe)}</p>
          <div class="meta"><span class="badge ${st.cls}">${st.label}</span></div>
        </div>
      </article>`;
  }

  function renderFeed() {
    renderHello();
    recomputeGeo();
    let list = geoCache;
    if (filter !== 'all') list = list.filter((g) => g.spot.cat === filter);
    if (nowOnly) list = list.filter((g) => statusOf(g.spot).order <= 2);
    list = list.slice().sort((a, b) =>
      (statusOf(a.spot).order - statusOf(b.spot).order) || (a.dist - b.dist));
    $('#feedList').innerHTML = list.map(cardHTML).join('');
    $('#feedEmpty').hidden = list.length > 0;
  }

  function renderSaved() {
    recomputeGeo();
    const list = geoCache.filter((g) => g.saved);
    $('#savedList').innerHTML = list.map(cardHTML).join('');
    $('#savedEmpty').hidden = list.length > 0;
  }

  /* ——— Friends tab ——— */
  function activityHTML(a) {
    const spot = findSpot(a.spotId);
    const d = spot && loc ? ` · ${fmtDist(distKm(loc, spot))} away` : '';
    const tagYou = a.mine ? ' (you)' : a.elsewhere ? ' (you · another device)' : '';
    return `
      <div class="act ${a.mine ? 'mine' : ''}" data-id="${a.spotId}">
        <span class="act-avatar">${a.who.emoji}</span>
        <div class="act-body">
          <p><b>${esc(a.who.name)}${tagYou}</b> ${esc(a.verb)}
             <b>${a.spotEmoji || ''} ${esc(a.spotName)}</b><span class="muted">${d}</span></p>
          <span class="act-ts">${fmtAgo(a.ts)}</span>
        </div>
      </div>`;
  }

  function visibleActivity(a) {
    // Friends-only feed: yours, your other devices', and current friends'.
    if (a.mine || a.elsewhere) return true;
    if (!a.who?.id) return true; // legacy entries from before friend ids
    return a.who.id === Store.state.profile?.id || Store.isFriend(a.who.id);
  }

  function renderFriends() {
    const online = Live.isOnline();
    const b = $('#liveBanner');
    if (online) {
      b.className = 'banner online';
      b.innerHTML = '🟢 Live — your friends show up here in real time. <span class="muted">Add a real friend by swapping Friend Codes.</span>';
    } else {
      const ts = Store.state.feedTs;
      b.className = 'banner offline';
      b.innerHTML = `📡 You're offline — showing activity cached ${ts ? fmtAgo(ts) : 'earlier'}. Everything else still works.`;
    }
    const friends = Store.ensureFriends();
    $('#friendCount').textContent = friends.length;
    $('#friendList').innerHTML = friends.length
      ? friends.map((f) => {
        const last = Store.chatWith(f.id).slice(-1)[0];
        const unread = Store.state.unread[f.id] || 0;
        const sub = last
          ? `${last.from === 'me' ? 'You: ' : ''}${last.text.length > 34 ? last.text.slice(0, 34) + '…' : last.text}`
          : (online ? 'Active now — tap to chat 💬' : 'Offline') + (f.seed ? ' · demo friend' : '');
        return `
        <div class="friend-row" data-chat="${f.id}" role="button" tabindex="0">
          <span class="f-avatar ${online ? 'on' : ''}">${f.emoji}</span>
          <div class="friend-info">
            <b>${esc(f.name)}</b>
            <span class="muted">${esc(sub)}</span>
          </div>
          ${unread ? `<span class="unread-pill">${unread}</span>` : ''}
          <button class="friend-x" data-unfriend="${f.id}" aria-label="Remove ${esc(f.name)}">✕</button>
        </div>`;
      }).join('')
      : '<p class="empty-line">No friends yet — swap Friend Codes to build your circle.</p>';
    const feed = Store.state.feed.filter(visibleActivity);
    $('#liveFeed').innerHTML = feed.length
      ? feed.map(activityHTML).join('')
      : '<p class="empty-line">No activity yet — it will pour in once friends start exploring.</p>';
  }

  function openAddFriend() {
    $('#myFriendCode').value = Store.exportFriendCode();
    $('#friendCodeIn').value = '';
    openModal('friendModal');
  }

  /* ——— Texting ——— */
  let currentChat = null;
  const typingNow = {};

  function openChat(friendId) {
    const f = Store.ensureFriends().find((x) => x.id === friendId);
    if (!f) return;
    currentChat = friendId;
    $('#chatAvatar').textContent = f.emoji;
    $('#chatName').textContent = f.name;
    $('#chatStatus').textContent = Live.isOnline()
      ? 'Active now' : 'Offline — messages will queue';
    Store.markRead(friendId);
    openModal('chatModal');
    renderChat();
    updateUnreadUI();
    $('#chatInput').focus();
  }

  function renderChat() {
    if (!currentChat) return;
    const f = Store.ensureFriends().find((x) => x.id === currentChat);
    const thread = Store.chatWith(currentChat);
    const msgs = thread.length
      ? thread.map((m) => `
        <div class="msg ${m.from === 'me' ? 'me' : 'them'}">
          <div class="bubble">${esc(m.text)}</div>
          <span class="msg-ts">${fmtAgo(m.ts)}${m.pending ? ' · ⏳ queued' : ''}</span>
        </div>`).join('')
      : `<p class="empty-line">Say salam to ${esc(f?.name || 'your friend')} 👋${f?.seed ? '<br>(demo friend — they text back)' : ''}</p>`;
    $('#chatMsgs').innerHTML = msgs +
      (typingNow[currentChat] ? '<div class="msg them"><div class="bubble typing"><i></i><i></i><i></i></div></div>' : '');
    const box = $('#chatMsgs');
    box.scrollTop = box.scrollHeight;
  }

  function sendCurrentChat() {
    const inp = $('#chatInput');
    const text = inp.value.trim();
    if (!text || !currentChat) return;
    inp.value = '';
    const local = Live.sendChat(currentChat, text);
    renderChat();
    if (local.pending) toast('📡 Offline — queued, sends the moment you reconnect');
  }

  function updateUnreadUI() {
    if (Store.unreadTotal() > 0 && view !== 'friends') $('#liveDot').hidden = false;
  }

  function onChat(e) {
    if (e.incoming) {
      const chatOpen = currentChat === e.friendId && !$('#chatModal').hidden;
      if (chatOpen) { Store.markRead(e.friendId); renderChat(); }
      else {
        Store.bumpUnread(e.friendId);
        toast(`💬 ${e.emoji} ${e.name}: ${e.text.length > 44 ? e.text.slice(0, 44) + '…' : e.text}`);
      }
    } else {
      if (e.friendId && currentChat === e.friendId && !$('#chatModal').hidden) renderChat();
      if (e.flushed) toast(`📨 Sent ${e.flushed} queued message${e.flushed > 1 ? 's' : ''}`);
    }
    if (view === 'friends') renderFriends();
    updateUnreadUI();
  }

  function onTyping({ friendId, on }) {
    typingNow[friendId] = on;
    if (currentChat === friendId && !$('#chatModal').hidden) renderChat();
  }

  /* ——— Spot detail ——— */
  function openSpot(id) {
    const g = geoCache.find((x) => x.spot.id === id) ||
      { spot: findSpot(id), dist: 0, saved: Store.isSaved(id) };
    if (!g.spot) return;
    const { spot } = g;
    const st = statusOf(spot);
    const cat = CATEGORIES[spot.cat];
    $('#spotModal').innerHTML = `
      <div class="sheet-grab"></div>
      <div class="cover sheet-cover">
        ${Covers.coverSVG(spot)}
        ${spot.img ? `<img class="cover-img" src="${spot.img}" alt="" onerror="this.remove()">` : ''}
        <span class="cover-chip">${cat.emoji} ${cat.label}</span>
        ${st.cls === 'live' ? '<span class="cover-live">⚡ LIVE</span>' : ''}
      </div>
      <div class="spot-head">
        <div>
          <h2>${esc(spot.name)}</h2>
          <div class="meta">
            <span class="badge ${st.cls}">${st.label}</span>
            <span class="tag" data-cat="${spot.cat}">${cat.emoji} ${cat.label}</span>
          </div>
        </div>
      </div>
      <p class="vibe">${esc(spot.vibe)}</p>
      <p class="dist-line">📍 ${esc(spot.area || 'Nearby')} · ${fmtDist(g.dist)} from you · ${travelTime(g.dist)}${spot.price ? ' · ' + esc(spot.price) : ''}</p>
      <div class="row">
        <button class="btn ${g.saved ? 'ghost' : 'primary'}" id="spotSaveBtn">
          ${g.saved ? '♥ Saved — tap to remove' : '♡ Save this spot'}</button>
        <button class="btn ghost" id="spotShareBtn">📣 I'm here — tell friends</button>
      </div>`;
    openModal('spotModal');
    $('#spotSaveBtn').onclick = () => { toggleSave(spot.id); closeModals(); };
    $('#spotShareBtn').onclick = () => {
      Live.localActivity('is vibing at', spot);
      toast(`📣 Shared with friends${Live.isOnline() ? '' : ' — will look lonely, you are offline'}`);
      closeModals();
    };
  }

  function toggleSave(id) {
    const added = Store.toggleSaved(id);
    const spot = findSpot(id);
    if (added && spot) {
      Live.localActivity('just saved', spot);
      toast(`♥ Saved ${spot.name} — it's yours offline too`);
    }
    renderFeed(); renderSaved();
  }

  /* ——— Live events into UI ——— */
  function onActivity(a) {
    if (!a.mine && visibleActivity(a)) {
      const who = a.elsewhere ? `${a.who.name} (another device)` : a.who.name;
      toast(`${a.who.emoji} ${who} ${a.verb} ${a.spotEmoji || ''} ${a.spotName}`);
      const g = geoCache.find((x) => x.spot.id === a.spotId);
      if (g) Radar.addPing(g.dist, g.bearing);
      if (view !== 'friends') $('#liveDot').hidden = false;
    }
    if (view === 'friends') renderFriends();
  }

  let netPainted = false;
  function onNet(online) {
    const pill = $('#netToggle');
    pill.className = 'pill ' + (online ? 'live' : 'off');
    pill.innerHTML = online ? '<span class="dot"></span> LIVE' : '⛔ OFFLINE';
    pill.title = online
      ? 'Connected — click to simulate going offline'
      : 'Offline — cached data keeps everything working. Click to reconnect.';
    if (view === 'friends') renderFriends();
    if (netPainted) {
      toast(online ? '🟢 Back online — live layer resumed' : '📡 Offline mode — everything still works from cache');
    }
    netPainted = true;
  }

  /* ——— Location ——— */
  function setLocation(id) {
    const preset = LOCATIONS.find((l) => l.id === id) || LOCATIONS[0];
    Store.state.locId = id; Store.save();
    if (id === 'me') {
      if (!('geolocation' in navigator)) { toast('⚠️ No geolocation here — using DIAC'); return setLocation('diac'); }
      toast('📡 Finding you…');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'My location' };
          Store.state.myLoc = { lat: loc.lat, lng: loc.lng }; Store.save();
          locUpdated();
        },
        () => {
          if (Store.state.myLoc) {
            loc = { ...Store.state.myLoc, label: 'Last known' };
            toast('📍 Using last known fix (offline-friendly)');
          } else {
            toast('⚠️ Location blocked — using DIAC campus'); Store.state.locId = 'diac'; Store.save();
            loc = { lat: LOCATIONS[0].lat, lng: LOCATIONS[0].lng, label: LOCATIONS[0].label };
          }
          locUpdated();
        },
        { timeout: 8000 });
    } else {
      loc = { lat: preset.lat, lng: preset.lng, label: preset.label };
      locUpdated();
    }
  }
  function locUpdated() {
    // Distinct happenings wherever you land (DIAC keeps its curated demo events).
    localPopups = (loc && Store.state.locId !== 'diac')
      ? makeLocalPopups(loc.label, loc.lat, loc.lng, new Date()) : [];
    $('#locChip').textContent = `📍 ${loc.label}`;
    renderFeed(); renderSaved();
  }

  function teleportTo(lat, lng, label) {
    Store.state.locId = 'search';
    Store.state.lastSearch = { lat, lng, label };
    Store.save();
    loc = { lat, lng, label };
    locUpdated();
    toast(`🛬 ${label} — here's what's going on there`);
  }

  /* ——— Location search: instant local matches + live map geocoding ——— */
  let searchTimer = null, searchAbort = null;

  async function runSearch(q) {
    const box = $('#searchResults'), inp = $('#searchInput');
    const ql = q.toLowerCase();
    const areaMap = new Map();
    for (const s of getSpots()) if (s.area && !s.demo && !areaMap.has(s.area)) areaMap.set(s.area, s);
    const areas = [...areaMap.entries()].filter(([a]) => a.toLowerCase().includes(ql)).slice(0, 3);
    const spots = getSpots().filter((s) => s.name.toLowerCase().includes(ql)).slice(0, 3);
    let html = '';
    for (const [a, s] of areas)
      html += `<button class="sr" data-go="loc" data-lat="${s.lat}" data-lng="${s.lng}" data-label="${esc(a)}">📍 <b>${esc(a)}</b> <span class="muted">area</span></button>`;
    for (const s of spots)
      html += `<button class="sr" data-go="spot" data-id="${s.id}">${s.emoji} <b>${esc(s.name)}</b> <span class="muted">${esc(s.area || '')}</span></button>`;
    box.innerHTML = html;
    box.hidden = false;

    if (!Live.isOnline()) {
      box.insertAdjacentHTML('beforeend',
        `<div class="sr-note">📡 Offline — showing known places only. Reconnect to search the whole map.</div>`);
      return;
    }
    box.insertAdjacentHTML('beforeend', `<div class="sr-note" id="srLoading">🌍 Searching the map…</div>`);
    try {
      if (searchAbort) searchAbort.abort();
      searchAbort = new AbortController();
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=4&q=${encodeURIComponent(q)}`,
        { signal: searchAbort.signal, headers: { Accept: 'application/json' } });
      const data = await res.json();
      document.getElementById('srLoading')?.remove();
      if (inp.value.trim() !== q) return; // user kept typing — stale results
      for (const r of (Array.isArray(data) ? data : [])) {
        const label = r.display_name.split(',').slice(0, 2).map((s) => s.trim()).join(', ');
        box.insertAdjacentHTML('beforeend',
          `<button class="sr" data-go="loc" data-lat="${r.lat}" data-lng="${r.lon}" data-label="${esc(label)}">🌍 <b>${esc(label)}</b> <span class="muted">${esc(r.type || 'place')}</span></button>`);
      }
      if (!box.querySelector('.sr'))
        box.innerHTML = '<div class="sr-note">Nothing found — try a landmark, area, or city name.</div>';
    } catch (e) { document.getElementById('srLoading')?.remove(); }
  }

  function bindSearch() {
    const inp = $('#searchInput'), box = $('#searchResults');
    inp.addEventListener('input', () => {
      clearTimeout(searchTimer);
      const q = inp.value.trim();
      if (!q) { box.hidden = true; box.innerHTML = ''; return; }
      searchTimer = setTimeout(() => runSearch(q), 320);
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { const first = box.querySelector('.sr'); if (first) first.click(); }
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrap')) box.hidden = true;
    });
    box.addEventListener('click', (e) => {
      const el = e.target.closest('[data-go]'); if (!el) return;
      box.hidden = true; inp.value = '';
      if (el.dataset.go === 'spot') { renderFeed(); openSpot(el.dataset.id); }
      else teleportTo(+el.dataset.lat, +el.dataset.lng, el.dataset.label);
    });
  }

  /* ——— Modals / toasts ——— */
  function openModal(id) {
    $('#modalBackdrop').hidden = false;
    $$('.modal').forEach((m) => (m.hidden = m.id !== id));
  }
  function closeModals() {
    $('#modalBackdrop').hidden = true;
    $$('.modal').forEach((m) => (m.hidden = true));
  }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    $('#toasts').appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 3800);
  }

  /* ——— Onboarding & profile ——— */
  const EMOJIS = ['🦊', '🐼', '🦋', '🐯', '🦉', '🐸', '🐙', '🦄'];
  let pickedEmoji = EMOJIS[0];

  function emojiGrid(sel, current) {
    return EMOJIS.map((e) =>
      `<button class="emoji-opt ${e === current ? 'sel' : ''}" data-em="${e}">${e}</button>`).join('');
  }

  function showOnboarding() {
    $('#obEmojis').innerHTML = emojiGrid('#obEmojis', pickedEmoji);
    openModal('onboardModal');
  }

  function refreshProfileBtn() {
    $('#profileBtn').textContent = Store.state.profile?.emoji || '🙂';
  }

  function openProfile() {
    const p = Store.state.profile || { name: '', emoji: pickedEmoji };
    $('#pfName').value = p.name;
    $('#pfEmojis').innerHTML = emojiGrid('#pfEmojis', p.emoji);
    $('#syncOut').value = '';
    $('#syncIn').value = '';
    openModal('profileModal');
  }

  /* ——— Drop a find ——— */
  function openDrop() {
    $('#dropName').value = '';
    $('#dropCat').value = 'food';
    openModal('dropModal');
    $('#dropName').focus();
  }
  function submitDrop() {
    const name = $('#dropName').value.trim();
    if (!name) return toast('Give your find a name first!');
    const jitter = () => (Math.random() - 0.5) * 0.004; // ~±200 m
    const spot = {
      id: 'u' + Date.now(), name, cat: $('#dropCat').value,
      emoji: CATEGORIES[$('#dropCat').value].emoji,
      lat: loc.lat + jitter(), lng: loc.lng + jitter(),
      hours: [0, 24], vibe: `Dropped by ${Store.state.profile?.name || 'you'} — go see what the fuss is.`,
      custom: true,
    };
    Store.addCustom(spot);
    Live.localActivity('found', spot);
    closeModals();
    toast(`📌 Dropped "${name}" — friends nearby just got pinged`);
    renderFeed();
  }

  /* ——— Utils ——— */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /* ——— Wiring ——— */
  function bind() {
    $$('.tabbar button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

    // Feed interactions (delegated)
    document.addEventListener('click', (e) => {
      const save = e.target.closest('[data-save]');
      if (save) { e.stopPropagation(); toggleSave(save.dataset.save); return; }
      const unfriend = e.target.closest('[data-unfriend]');
      if (unfriend) {
        e.stopPropagation();
        const f = Store.ensureFriends().find((x) => x.id === unfriend.dataset.unfriend);
        Store.removeFriend(unfriend.dataset.unfriend);
        toast(`👋 ${f ? f.name : 'Friend'} removed — their updates won't show anymore`);
        renderFriends();
        return;
      }
      const chatRow = e.target.closest('[data-chat]');
      if (chatRow) return openChat(chatRow.dataset.chat);
      const card = e.target.closest('.card[data-id]');
      if (card) return openSpot(card.dataset.id);
      const act = e.target.closest('.act[data-id]');
      if (act && findSpot(act.dataset.id)) return openSpot(act.dataset.id);
      const em = e.target.closest('.emoji-opt');
      if (em) {
        pickedEmoji = em.dataset.em;
        em.parentElement.querySelectorAll('.emoji-opt').forEach((x) => x.classList.toggle('sel', x === em));
      }
    });

    $('#nowToggle').addEventListener('click', () => {
      nowOnly = !nowOnly;
      $('#nowToggle').classList.toggle('active', nowOnly);
      renderFeed();
    });
    $('#catChips').addEventListener('click', (e) => {
      const c = e.target.closest('[data-cat]'); if (!c) return;
      filter = c.dataset.cat;
      $$('#catChips [data-cat]').forEach((x) => x.classList.toggle('active', x === c));
      renderFeed();
    });
    $('#feedShowAll').addEventListener('click', () => {
      nowOnly = false; filter = 'all';
      $('#nowToggle').classList.remove('active');
      $$('#catChips [data-cat]').forEach((x) => x.classList.toggle('active', x.dataset.cat === 'all'));
      renderFeed();
    });

    $('#netToggle').addEventListener('click', () => Live.setManualOffline(!Store.state.manualOffline));
    $('#locChip').addEventListener('click', () => {
      $('#locList').innerHTML = LOCATIONS.map((l) =>
        `<button class="loc-opt ${Store.state.locId === l.id ? 'sel' : ''}" data-loc="${l.id}">
           ${l.id === 'me' ? '🛰' : '📍'} ${l.label}</button>`).join('');
      openModal('locModal');
    });
    $('#locList').addEventListener('click', (e) => {
      const b = e.target.closest('[data-loc]'); if (!b) return;
      closeModals(); setLocation(b.dataset.loc);
    });

    $('#themeBtn').addEventListener('click', () => Theme.cycle());
    $('#profileBtn').addEventListener('click', openProfile);
    $('#addFriendBtn').addEventListener('click', openAddFriend);
    $('#friendCodeCopy').addEventListener('click', async () => {
      const code = $('#myFriendCode').value;
      try { await navigator.clipboard.writeText(code); toast('🤝 Friend Code copied — send it to a friend'); }
      catch { $('#myFriendCode').select(); toast('🤝 Code ready — copy it from the box'); }
    });
    $('#friendCodeAdd').addEventListener('click', () => {
      try {
        const f = Store.importFriendCode($('#friendCodeIn').value);
        closeModals();
        toast(`🎉 You and ${f.name} ${f.emoji} are now friends`);
        renderFriends();
      } catch (err) { toast('⚠️ ' + err.message); }
    });
    $('#chatSend').addEventListener('click', sendCurrentChat);
    $('#chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendCurrentChat(); });
    $('#chatBack').addEventListener('click', closeModals);
    $('#fab').addEventListener('click', openDrop);
    $('#dropGo').addEventListener('click', submitDrop);
    $('#dropName').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitDrop(); });

    $('#obStart').addEventListener('click', () => {
      const name = $('#obName').value.trim() || 'Explorer';
      Store.state.profile = { name, emoji: pickedEmoji };
      Store.save(); Store.ensureProfileId();
      refreshProfileBtn(); closeModals(); renderHello();
      toast(`Welcome, ${name}! No password, no signup — you're in. ✨`);
    });
    $('#obName').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#obStart').click(); });

    $('#pfSave').addEventListener('click', () => {
      const name = $('#pfName').value.trim() || 'Explorer';
      Store.state.profile = { ...(Store.state.profile || {}), name, emoji: pickedEmoji };
      Store.save(); Store.ensureProfileId();
      refreshProfileBtn(); closeModals(); renderHello();
      toast('Profile updated ✔');
    });
    $('#syncCopy').addEventListener('click', async () => {
      const code = Store.exportCode();
      $('#syncOut').value = code;
      try { await navigator.clipboard.writeText(code); toast('🔑 Sync Code copied — paste it on any device'); }
      catch { $('#syncOut').select(); toast('🔑 Code ready — copy it from the box'); }
    });
    $('#syncGo').addEventListener('click', () => {
      try {
        Store.importCode($('#syncIn').value);
        pickedEmoji = Store.state.profile?.emoji || pickedEmoji;
        refreshProfileBtn(); closeModals();
        toast('✅ Synced! Your spots followed you here.');
        renderFeed(); renderSaved();
        if (view === 'friends') renderFriends();
      } catch (err) { toast('⚠️ ' + err.message); }
    });

    $('#modalBackdrop').addEventListener('click', closeModals);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });
  }

  function init() {
    Store.load();
    Store.ensureFriends();
    Store.ensureProfileId();
    demoEvents = makeDemoEvents(new Date());
    bind();
    Theme.apply();

    const saved = LOCATIONS.find((l) => l.id === Store.state.locId);
    if (Store.state.locId === 'search' && Store.state.lastSearch) {
      loc = { ...Store.state.lastSearch };
    } else if (Store.state.locId === 'me' && Store.state.myLoc) {
      loc = { ...Store.state.myLoc, label: 'My location' };
    } else {
      const p = (saved && saved.lat != null) ? saved : LOCATIONS[0];
      loc = { lat: p.lat, lng: p.lng, label: p.label };
    }
    locUpdated();
    bindSearch();

    Radar.init($('#radar'), radarData, openSpot);
    Live.init();
    Live.on('activity', onActivity);
    Live.on('net', onNet);
    Live.on('chat', onChat);
    Live.on('typing', onTyping);
    Live.netChanged(); // paint the initial pill state (first paint skips the toast)

    refreshProfileBtn();
    setView('now');
    if (!Store.state.profile) showOnboarding();

    // Refresh time-sensitive badges every minute.
    setInterval(() => { if (view === 'now') renderFeed(); }, 60000);

    // Offline superpower: cache the whole app shell.
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  return { init, getSpots };
})();

document.addEventListener('DOMContentLoaded', App.init);
