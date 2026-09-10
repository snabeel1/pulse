/* Seed spot data — Dubai, clustered around DIAC / Academic City with city-wide favourites.
   Hours are 24h local floats; [18, 2] means 6 PM until 2 AM (overnight). */

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
    hours: [6.5, 23], vibe: 'Study-fuel espresso and karak, two minutes from campus.' },
  { id: 's02', name: 'Wok This Way', cat: 'food', emoji: '🥡', lat: 25.1231, lng: 55.4224,
    hours: [11, 1], vibe: 'Late-night noodle boxes that rescue every deadline.' },
  { id: 's03', name: 'DSO Skate Spot', cat: 'fun', emoji: '🛹', lat: 25.1212,
    lng: 55.3791, hours: [7, 24], vibe: 'Smooth ledges, friendly locals, golden-hour sessions.' },
  { id: 's04', name: 'Cedre Community Lawn', cat: 'chill', emoji: '🧺', lat: 25.1160, lng: 55.3772,
    hours: [6, 23.5], vibe: 'Picnic grass and shisha cafés around the fountain.' },
  { id: 's05', name: 'Open Mic @ The Loft', cat: 'event', emoji: '🎤', lat: 25.1287, lng: 55.4141,
    hours: [10, 23], event: { title: 'Open Mic Night', start: 20, end: 23 },
    vibe: 'Student comedians and acoustic sets every night this week.' },
  { id: 's06', name: 'Silicon Central Arcade', cat: 'fun', emoji: '🕹️', lat: 25.1180, lng: 55.3850,
    hours: [10, 24], vibe: 'Retro cabinets, air hockey, and a mean claw machine.' },

  // ——— Mirdif / Khawaneej ———
  { id: 's07', name: 'Last Exit Al Khawaneej', cat: 'food', emoji: '🚚', lat: 25.2428, lng: 55.4851,
    hours: [8, 24], event: { title: 'Food Truck Fridays', start: 17, end: 24 },
    vibe: 'Drive-in food-truck park with neon signs and loaded fries.' },
  { id: 's08', name: 'Mushrif Park Trails', cat: 'chill', emoji: '🚴', lat: 25.2246, lng: 55.4550,
    hours: [8, 22], vibe: 'Ghaf-tree cycling loops and BBQ pits at sunset.' },
  { id: 's09', name: 'Mirdif City Centre iFly', cat: 'fun', emoji: '🪂', lat: 25.2161, lng: 55.4080,
    hours: [10, 23], vibe: 'Indoor skydiving — scream politely, it is a mall.' },

  // ——— Global Village / Outlet corridor ———
  { id: 's10', name: 'Global Village', cat: 'event', emoji: '🌍', lat: 25.0692, lng: 55.3062,
    hours: [16, 1], event: { title: 'Fireworks Show', start: 21, end: 21.5 },
    vibe: '90 cultures, street food galore, fireworks most nights.' },

  // ——— Downtown ———
  { id: 's11', name: 'Dubai Fountain Show', cat: 'event', emoji: '⛲', lat: 25.1953, lng: 55.2757,
    hours: [18, 23], event: { title: 'Fountain Show (every 30 min)', start: 18, end: 23 },
    vibe: 'The classic. Free, loud, unreasonably moving.' },
  { id: 's12', name: 'Souk Al Bahar Terrace', cat: 'food', emoji: '🍢', lat: 25.1945, lng: 55.2760,
    hours: [10, 1], vibe: 'Burj views with mezze — arrive before the fountain crowds.' },
  { id: 's13', name: 'Dubai Opera', cat: 'culture', emoji: '🎻', lat: 25.1939, lng: 55.2733,
    hours: [10, 23], event: { title: 'Evening Performance', start: 19.5, end: 22 },
    vibe: 'Dhow-shaped hall; rush tickets sometimes drop at 6 PM.' },
  { id: 's14', name: 'Sketch Walk DIFC', cat: 'culture', emoji: '🖌️', lat: 25.2110, lng: 55.2800,
    hours: [8, 24], vibe: 'Gallery alleys and murals between the towers.' },

  // ——— Creek / Old Dubai ———
  { id: 's15', name: 'Al Seef Promenade', cat: 'chill', emoji: '🏮', lat: 25.2603, lng: 55.2998,
    hours: [8, 24], vibe: 'Lantern-lit creekside, abra rides for one dirham.' },
  { id: 's16', name: 'Deira Gold Souk', cat: 'culture', emoji: '💰', lat: 25.2707, lng: 55.2972,
    hours: [10, 22], vibe: 'Window-shop a kilo of gold, haggle for saffron next door.' },
  { id: 's17', name: 'Ravi Restaurant', cat: 'food', emoji: '🍛', lat: 25.2421, lng: 55.2761,
    hours: [5, 2], vibe: 'Legendary Pakistani karak-and-karahi institution since 1978.' },
  { id: 's18', name: 'Dubai Frame Park', cat: 'fun', emoji: '🖼️', lat: 25.2354, lng: 55.3002,
    hours: [9, 21], vibe: 'Walk the glass bridge between old and new Dubai.' },

  // ——— Jumeirah coast ———
  { id: 's19', name: 'Kite Beach', cat: 'chill', emoji: '🏖️', lat: 25.1763, lng: 55.2384,
    hours: [6, 23], event: { title: 'Sunrise Run Club', start: 6, end: 8 },
    vibe: 'Kitesurfers, volleyball nets, and the best beach shawarma.' },
  { id: 's20', name: 'La Mer Beachfront', cat: 'fun', emoji: '🛼', lat: 25.2270, lng: 55.2565,
    hours: [10, 24], vibe: 'Street-art beach town with a skate bowl by the water.' },
  { id: 's21', name: 'Alserkal Avenue', cat: 'culture', emoji: '🎨', lat: 25.1440, lng: 55.2260,
    hours: [10, 20], vibe: 'Warehouse galleries, indie cinema, specialty coffee.' },
  { id: 's22', name: 'Madinat Jumeirah Souk', cat: 'food', emoji: '🥙', lat: 25.1330, lng: 55.1850,
    hours: [10, 23.5], vibe: 'Canal-side dinner with wind-tower views of the Burj Al Arab.' },

  // ——— Marina / JBR ———
  { id: 's23', name: 'Marina Walk', cat: 'chill', emoji: '🌉', lat: 25.0770, lng: 55.1330,
    hours: [0, 24], vibe: 'Seven km of yachts, gelato, and skyline neck-cramps.' },
  { id: 's24', name: 'JBR The Beach Cinema', cat: 'event', emoji: '🎬', lat: 25.0776, lng: 55.1327,
    hours: [10, 24], event: { title: 'Open-Air Movie Night', start: 20, end: 22.5 },
    vibe: 'Deck chairs, popcorn, and a film under the towers.' },
  { id: 's25', name: 'Creek Harbour Viewpoint', cat: 'chill', emoji: '🌇', lat: 25.2030, lng: 55.3430,
    hours: [6, 24], vibe: 'Skyline panorama with flamingos in the sanctuary next door.' },
  { id: 's26', name: 'Time Out Market DIFC', cat: 'food', emoji: '🍱', lat: 25.2119, lng: 55.2836,
    hours: [12, 24], vibe: 'Seventeen of the city’s best kitchens under one roof.' },
];

/* Demo pop-up events: seeded relative to load time so the "happening right now" feed
   is always alive during a live presentation, whatever the hour. Clearly synthetic —
   a production build would pull these from an events API. */
function makeDemoEvents(now) {
  const h = now.getHours() + now.getMinutes() / 60;
  const wrap = (x) => ((x % 24) + 24) % 24;
  return [
    { id: 'd01', name: 'Pop-Up Karak Cart', cat: 'food', emoji: '🫖', lat: 25.1268, lng: 55.4205,
      hours: [0, 24], event: { title: 'Karak Happy Hour', start: wrap(h - 0.5), end: wrap(h + 1.5) },
      vibe: 'Surprise cart outside the library — 1 AED karak while it lasts.', demo: true },
    { id: 'd02', name: 'Rooftop Stargazing Meetup', cat: 'event', emoji: '🔭', lat: 25.1195, lng: 55.3820,
      hours: [0, 24], event: { title: 'Telescope Night', start: wrap(h + 0.75), end: wrap(h + 3) },
      vibe: 'Astronomy club sharing telescopes on the DSO rooftop.', demo: true },
    { id: 'd03', name: 'Flash Art Drop', cat: 'culture', emoji: '🖼️', lat: 25.1305, lng: 55.4160,
      hours: [0, 24], event: { title: 'Student Print Sale', start: wrap(h - 0.25), end: wrap(h + 2) },
      vibe: 'Design students selling prints for the price of a coffee.', demo: true },
  ];
}

/* Preset locations for the demo — geolocation is available but a presentation room
   deserves a deterministic starting point. */
const LOCATIONS = [
  { id: 'diac',     label: 'DIAC Campus',    lat: 25.1279, lng: 55.4188 },
  { id: 'downtown', label: 'Downtown Dubai', lat: 25.1972, lng: 55.2744 },
  { id: 'marina',   label: 'Dubai Marina',   lat: 25.0772, lng: 55.1340 },
  { id: 'me',       label: 'My location',    lat: null,    lng: null },
];
