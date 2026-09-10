/* Seed spot data — Dubai, clustered around DIAC / Academic City with city-wide favourites.
   Hours are 24h local floats; [18, 2] means 6 PM until 2 AM (overnight).
   `scene` + `tone` pick the illustrated cover (see covers.js); `area` and
   `price` feed the card meta row. */

const CATEGORIES = {
  food:    { label: 'Food',    emoji: '🍜', color: '#ff7a59' },
  event:   { label: 'Events',  emoji: '🎉', color: '#c084fc' },
  fun:     { label: 'Fun',     emoji: '🎢', color: '#38bdf8' },
  chill:   { label: 'Chill',   emoji: '🌴', color: '#4ade80' },
  culture: { label: 'Culture', emoji: '🎭', color: '#facc15' },
};

const SPOTS = [
  // ——— Academic City / Silicon Oasis cluster (near DIAC) ———
  { id: 's01', name: 'Brew & Bean AC', cat: 'food', emoji: '☕', lat: 25.1259, lng: 55.4180,
    area: 'Academic City', price: '~AED 15', scene: 'oldtown', tone: 'dawn',
    hours: [6.5, 23], vibe: 'Study-fuel espresso and karak, two minutes from campus.' },
  { id: 's02', name: 'Wok This Way', cat: 'food', emoji: '🥡', lat: 25.1231, lng: 55.4224,
    area: 'Academic City', price: '~AED 25', scene: 'downtown', tone: 'night',
    hours: [11, 1], vibe: 'Late-night noodle boxes that rescue every deadline.' },
  { id: 's03', name: 'DSO Skate Spot', cat: 'fun', emoji: '🛹', lat: 25.1212, lng: 55.3791,
    area: 'Silicon Oasis', price: 'Free', scene: 'park', tone: 'dusk',
    hours: [7, 24], vibe: 'Smooth ledges, friendly locals, golden-hour sessions.' },
  { id: 's04', name: 'Cedre Community Lawn', cat: 'chill', emoji: '🧺', lat: 25.1160, lng: 55.3772,
    area: 'Silicon Oasis', price: 'Free', scene: 'park', tone: 'day',
    hours: [6, 23.5], vibe: 'Picnic grass and shisha cafés around the fountain.' },
  { id: 's05', name: 'Open Mic @ The Loft', cat: 'event', emoji: '🎤', lat: 25.1287, lng: 55.4141,
    area: 'Academic City', price: '~AED 20', scene: 'downtown', tone: 'night',
    hours: [10, 23], event: { title: 'Open Mic Night', start: 20, end: 23 },
    vibe: 'Student comedians and acoustic sets every night this week.' },
  { id: 's06', name: 'Silicon Central Arcade', cat: 'fun', emoji: '🕹️', lat: 25.1180, lng: 55.3850,
    area: 'Silicon Oasis', price: '~AED 40', scene: 'rides', tone: 'night',
    hours: [10, 24], vibe: 'Retro cabinets, air hockey, and a mean claw machine.' },

  // ——— Mirdif / Khawaneej ———
  { id: 's07', name: 'Last Exit Al Khawaneej', cat: 'food', emoji: '🚚', lat: 25.2428, lng: 55.4851,
    area: 'Al Khawaneej', price: '~AED 35', scene: 'rides', tone: 'dusk',
    hours: [8, 24], event: { title: 'Food Truck Fridays', start: 17, end: 24 },
    vibe: 'Drive-in food-truck park with neon signs and loaded fries.' },
  { id: 's08', name: 'Mushrif Park Trails', cat: 'chill', emoji: '🚴', lat: 25.2246, lng: 55.4550,
    area: 'Mushrif', price: '~AED 3', scene: 'park', tone: 'day',
    hours: [8, 22], vibe: 'Ghaf-tree cycling loops and BBQ pits at sunset.' },
  { id: 's09', name: 'Mirdif City Centre iFly', cat: 'fun', emoji: '🪂', lat: 25.2161, lng: 55.4080,
    area: 'Mirdif', price: '~AED 220', scene: 'rides', tone: 'day',
    hours: [10, 23], vibe: 'Indoor skydiving — scream politely, it is a mall.' },

  // ——— Global Village / Outlet corridor ———
  { id: 's10', name: 'Global Village', cat: 'event', emoji: '🌍', lat: 25.0692, lng: 55.3062,
    area: 'Global Village', price: '~AED 25', scene: 'rides', tone: 'night',
    hours: [16, 1], event: { title: 'Fireworks Show', start: 21, end: 21.5 },
    vibe: '90 cultures, street food galore, fireworks most nights.' },

  // ——— Downtown ———
  { id: 's11', name: 'Dubai Fountain Show', cat: 'event', emoji: '⛲', lat: 25.1953, lng: 55.2757,
    area: 'Downtown', price: 'Free', scene: 'downtown', tone: 'dusk',
    hours: [18, 23], event: { title: 'Fountain Show (every 30 min)', start: 18, end: 23 },
    vibe: 'The classic. Free, loud, unreasonably moving.' },
  { id: 's12', name: 'Souk Al Bahar Terrace', cat: 'food', emoji: '🍢', lat: 25.1945, lng: 55.2760,
    area: 'Downtown', price: '~AED 90', scene: 'downtown', tone: 'dusk',
    hours: [10, 1], vibe: 'Burj views with mezze — arrive before the fountain crowds.' },
  { id: 's13', name: 'Dubai Opera', cat: 'culture', emoji: '🎻', lat: 25.1939, lng: 55.2733,
    area: 'Downtown', price: 'AED 150+', scene: 'downtown', tone: 'night',
    hours: [10, 23], event: { title: 'Evening Performance', start: 19.5, end: 22 },
    vibe: 'Dhow-shaped hall; rush tickets sometimes drop at 6 PM.' },
  { id: 's14', name: 'Sketch Walk DIFC', cat: 'culture', emoji: '🖌️', lat: 25.2110, lng: 55.2800,
    area: 'DIFC', price: 'Free', scene: 'downtown', tone: 'day',
    hours: [8, 24], vibe: 'Gallery alleys and murals between the towers.' },

  // ——— Creek / Old Dubai ———
  { id: 's15', name: 'Al Seef Promenade', cat: 'chill', emoji: '🏮', lat: 25.2603, lng: 55.2998,
    area: 'Al Seef', price: 'Free', scene: 'oldtown', tone: 'dusk',
    hours: [8, 24], vibe: 'Lantern-lit creekside, abra rides for one dirham.' },
  { id: 's16', name: 'Deira Gold Souk', cat: 'culture', emoji: '💰', lat: 25.2707, lng: 55.2972,
    area: 'Deira', price: 'Free', scene: 'oldtown', tone: 'day',
    hours: [10, 22], vibe: 'Window-shop a kilo of gold, haggle for saffron next door.' },
  { id: 's17', name: 'Ravi Restaurant', cat: 'food', emoji: '🍛', lat: 25.2421, lng: 55.2761,
    area: 'Al Satwa', price: '~AED 30', scene: 'oldtown', tone: 'night',
    hours: [5, 2], vibe: 'Legendary Pakistani karak-and-karahi institution since 1978.' },
  { id: 's18', name: 'Dubai Frame Park', cat: 'fun', emoji: '🖼️', lat: 25.2354, lng: 55.3002,
    area: 'Zabeel', price: '~AED 50', scene: 'downtown', tone: 'day',
    hours: [9, 21], vibe: 'Walk the glass bridge between old and new Dubai.' },

  // ——— Jumeirah coast ———
  { id: 's19', name: 'Kite Beach', cat: 'chill', emoji: '🏖️', lat: 25.1763, lng: 55.2384,
    area: 'Umm Suqeim', price: 'Free', scene: 'coast', tone: 'dawn',
    hours: [6, 23], event: { title: 'Sunrise Run Club', start: 6, end: 8 },
    vibe: 'Kitesurfers, volleyball nets, and the best beach shawarma.' },
  { id: 's20', name: 'La Mer Beachfront', cat: 'fun', emoji: '🛼', lat: 25.2270, lng: 55.2565,
    area: 'La Mer', price: 'Free', scene: 'coast', tone: 'day',
    hours: [10, 24], vibe: 'Street-art beach town with a skate bowl by the water.' },
  { id: 's21', name: 'Alserkal Avenue', cat: 'culture', emoji: '🎨', lat: 25.1440, lng: 55.2260,
    area: 'Al Quoz', price: 'Free', scene: 'oldtown', tone: 'day',
    hours: [10, 20], vibe: 'Warehouse galleries, indie cinema, specialty coffee.' },
  { id: 's22', name: 'Madinat Jumeirah Souk', cat: 'food', emoji: '🥙', lat: 25.1330, lng: 55.1850,
    area: 'Umm Suqeim', price: '~AED 120', scene: 'coast', tone: 'dusk',
    hours: [10, 23.5], vibe: 'Canal-side dinner with wind-tower views of the Burj Al Arab.' },

  // ——— Marina / JBR ———
  { id: 's23', name: 'Marina Walk', cat: 'chill', emoji: '🌉', lat: 25.0770, lng: 55.1330,
    area: 'Dubai Marina', price: 'Free', scene: 'marina', tone: 'dusk',
    hours: [0, 24], vibe: 'Seven km of yachts, gelato, and skyline neck-cramps.' },
  { id: 's24', name: 'JBR The Beach Cinema', cat: 'event', emoji: '🎬', lat: 25.0776, lng: 55.1327,
    area: 'JBR', price: '~AED 50', scene: 'marina', tone: 'night',
    hours: [10, 24], event: { title: 'Open-Air Movie Night', start: 20, end: 22.5 },
    vibe: 'Deck chairs, popcorn, and a film under the towers.' },
  { id: 's25', name: 'Creek Harbour Viewpoint', cat: 'chill', emoji: '🌇', lat: 25.2030, lng: 55.3430,
    area: 'Creek Harbour', price: 'Free', scene: 'coast', tone: 'dusk',
    hours: [6, 24], vibe: 'Skyline panorama with flamingos in the sanctuary next door.' },
  { id: 's26', name: 'Time Out Market DIFC', cat: 'food', emoji: '🍱', lat: 25.2119, lng: 55.2836,
    area: 'DIFC', price: '~AED 60', scene: 'downtown', tone: 'day',
    hours: [12, 24], vibe: 'Seventeen of the city’s best kitchens under one roof.' },

  // ——— wider city, so any search lands somewhere lively ———
  { id: 's27', name: 'Marasi Promenade', cat: 'chill', emoji: '🚤', lat: 25.1857, lng: 55.2665,
    area: 'Business Bay', price: 'Free', scene: 'downtown', tone: 'dusk',
    hours: [6, 24], vibe: 'Canal boardwalk with floating villas and skyline views.' },
  { id: 's28', name: 'Ain Dubai Plaza', cat: 'fun', emoji: '🎡', lat: 25.0789, lng: 55.1224,
    area: 'Bluewaters', price: '~AED 90', scene: 'rides', tone: 'dusk',
    hours: [11, 24], event: { title: 'Light Show', start: 20, end: 20.5 },
    vibe: 'The world’s tallest wheel, glowing over the water.' },
  { id: 's29', name: 'The Pointe Fountain', cat: 'event', emoji: '🌴', lat: 25.1109, lng: 55.1443,
    area: 'Palm Jumeirah', price: 'Free', scene: 'coast', tone: 'night',
    hours: [10, 24], event: { title: 'Palm Fountain Show', start: 19, end: 23 },
    vibe: 'Atlantis views and the world’s largest fountain across the bay.' },
  { id: 's30', name: 'Karama Food Crawl', cat: 'food', emoji: '🥘', lat: 25.2489, lng: 55.3033,
    area: 'Al Karama', price: '~AED 20', scene: 'oldtown', tone: 'night',
    hours: [8, 1], vibe: 'Dosa, chaat, and murals down every side street.' },
  { id: 's31', name: 'Expo City Al Wasl Dome', cat: 'culture', emoji: '🔮', lat: 24.9614, lng: 55.1520,
    area: 'Expo City', price: '~AED 40', scene: 'downtown', tone: 'night',
    hours: [10, 22], event: { title: 'Dome Projection Show', start: 19.5, end: 21 },
    vibe: 'A 360° projection dome you have to stand under once.' },
  { id: 's32', name: 'JLT Park Nights', cat: 'chill', emoji: '🧘', lat: 25.0693, lng: 55.1420,
    area: 'JLT', price: 'Free', scene: 'marina', tone: 'dusk',
    hours: [6, 24], vibe: 'Lakeside lawns between the towers — quiet, somehow.' },
];

/* Demo pop-up events: seeded relative to load time so the "happening right now" feed
   is always alive during a live presentation, whatever the hour. Clearly synthetic —
   a production build would pull these from an events API. */
function makeDemoEvents(now) {
  const h = now.getHours() + now.getMinutes() / 60;
  const wrap = (x) => ((x % 24) + 24) % 24;
  return [
    { id: 'd01', name: 'Pop-Up Karak Cart', cat: 'food', emoji: '🫖', lat: 25.1268, lng: 55.4205,
      area: 'Academic City', price: 'AED 1', scene: 'oldtown', tone: 'dusk',
      hours: [0, 24], event: { title: 'Karak Happy Hour', start: wrap(h - 0.5), end: wrap(h + 1.5) },
      vibe: 'Surprise cart outside the library — 1 AED karak while it lasts.', demo: true },
    { id: 'd02', name: 'Rooftop Stargazing Meetup', cat: 'event', emoji: '🔭', lat: 25.1195, lng: 55.3820,
      area: 'Silicon Oasis', price: 'Free', scene: 'park', tone: 'night',
      hours: [0, 24], event: { title: 'Telescope Night', start: wrap(h + 0.75), end: wrap(h + 3) },
      vibe: 'Astronomy club sharing telescopes on the DSO rooftop.', demo: true },
    { id: 'd03', name: 'Flash Art Drop', cat: 'culture', emoji: '🖼️', lat: 25.1305, lng: 55.4160,
      area: 'Academic City', price: '~AED 10', scene: 'oldtown', tone: 'day',
      hours: [0, 24], event: { title: 'Student Print Sale', start: wrap(h - 0.25), end: wrap(h + 2) },
      vibe: 'Design students selling prints for the price of a coffee.', demo: true },
  ];
}

/* Real landmark photos (Wikipedia lead images, fetched at build time and
   served locally — offline still works; see IMAGE_CREDITS.md). Fictional
   spots keep their generated SVG cover art, which also renders beneath every
   photo as the loading/offline fallback. */
const SPOT_IMAGES = {
  s08: 'img/s08.jpg', s09: 'img/s09.jpg', s10: 'img/s10.jpg', s11: 'img/s11.jpg',
  s12: 'img/s12.jpg', s15: 'img/s15.jpg', s16: 'img/s16.jpg', s18: 'img/s18.jpg',
  s19: 'img/s19.jpg', s21: 'img/s21.jpg', s22: 'img/s22.jpg', s23: 'img/s23.jpg',
  s24: 'img/s24.jpg', s27: 'img/s27.jpg', s28: 'img/s28.jpg', s29: 'img/s29.jpg',
  s30: 'img/s30.jpg', s32: 'img/s32.jpg',
};
for (const s of SPOTS) if (SPOT_IMAGES[s.id]) s.img = SPOT_IMAGES[s.id];

/* Distinct pop-up events for a searched location: wherever you land, Pulse
   seeds a handful of happenings around that exact point, deterministic per
   place name (searching "Hatta" twice shows the same events). Labeled demo —
   production swaps this for a real events API keyed by geohash. */
const POPUP_TEMPLATES = [
  { name: '{p} Night Market', cat: 'event', emoji: '🏮', price: 'Free', tone: 'night', scene: 'oldtown',
    vibe: 'Lantern stalls, street snacks, and someone playing an oud.', evt: 'Night Market', dur: 4 },
  { name: 'Street Food Rally', cat: 'food', emoji: '🌮', price: '~AED 15', tone: 'dusk', scene: 'rides',
    vibe: 'Rotating food trucks parked up near {p} tonight.', evt: 'Food Truck Rally', dur: 5 },
  { name: '{p} Art Walk', cat: 'culture', emoji: '🖼️', price: 'Free', tone: 'day', scene: 'oldtown',
    vibe: 'Local artists hanging work along the walkways of {p}.', evt: 'Open-Air Gallery', dur: 6 },
  { name: 'Rooftop Cinema', cat: 'event', emoji: '🎬', price: '~AED 45', tone: 'night', scene: 'downtown',
    vibe: 'Deck chairs and a classic under the stars near {p}.', evt: 'Tonight’s Screening', dur: 2.5 },
  { name: 'Majlis Coffee Circle', cat: 'chill', emoji: '☕', price: '~AED 10', tone: 'dawn', scene: 'park',
    vibe: 'Gahwa, dates, and slow conversation — {p} style.', evt: 'Morning Majlis', dur: 3 },
  { name: 'Five-a-Side Pickup', cat: 'fun', emoji: '⚽', price: 'Free', tone: 'dusk', scene: 'park',
    vibe: 'Open game near {p} — bring water, claim a bib.', evt: 'Pickup Football', dur: 2 },
  { name: 'Drone Light Show', cat: 'event', emoji: '🛸', price: 'Free', tone: 'night', scene: 'marina',
    vibe: '300 drones sketching shapes over {p} after dark.', evt: 'Drone Show', dur: 1 },
  { name: 'Sunset Run Club', cat: 'fun', emoji: '🏃', price: 'Free', tone: 'dusk', scene: 'coast',
    vibe: '5K loop starting by {p} — all paces welcome.', evt: 'Golden Hour 5K', dur: 1.5 },
];

function makeLocalPopups(label, lat, lng, now) {
  let h = 5381;
  for (const ch of label.toLowerCase()) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  const rand = () => { h = (Math.imul(h, 1597334677) + 12345) >>> 0; return h / 4294967296; };
  const nowH = now.getHours() + now.getMinutes() / 60;
  const wrap = (x) => ((x % 24) + 24) % 24;
  const picks = [...POPUP_TEMPLATES].sort(() => rand() - 0.5).slice(0, 3);
  return picks.map((t, i) => {
    const start = wrap(nowH + (i === 0 ? -0.5 : i * 1.25)); // one live now, others soon
    return {
      id: 'p' + (h + i), name: t.name.replace('{p}', label), cat: t.cat, emoji: t.emoji,
      lat: lat + (rand() - 0.5) * 0.02, lng: lng + (rand() - 0.5) * 0.02,
      area: label, price: t.price, scene: t.scene, tone: t.tone,
      hours: [0, 24], event: { title: t.evt, start, end: wrap(start + t.dur) },
      vibe: t.vibe.replace('{p}', label), demo: true,
    };
  });
}

/* Preset locations for the demo — geolocation is available but a presentation room
   deserves a deterministic starting point. */
const LOCATIONS = [
  { id: 'diac',     label: 'DIAC Campus',    lat: 25.1279, lng: 55.4188 },
  { id: 'downtown', label: 'Downtown Dubai', lat: 25.1972, lng: 55.2744 },
  { id: 'marina',   label: 'Dubai Marina',   lat: 25.0772, lng: 55.1340 },
  { id: 'me',       label: 'My location',    lat: null,    lng: null },
];
