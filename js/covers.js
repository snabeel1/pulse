/* Cover art engine — every spot gets a unique illustrated Dubai scene,
   drawn as inline SVG by this file. No stock photos, no image CDNs, no API
   keys: covers cost 0 KB of assets, render crisp at any DPI, and work with
   zero connectivity. Scene + tone come from data.js; small details (sun
   position, clouds, stars) are seeded from the spot id so no two covers
   are identical. */

const Covers = (() => {
  const W = 640, H = 360, GROUND = 268;

  const TONES = {
    dawn:  { sky: ['#ffe3c8', '#ffb59e', '#c9a3d6'], orb: '#fff4da', orbGlow: '#ffd9a0',
             sil: '#7b5680', sil2: '#96688f', ground: '#5d4266', water: '#d9928f', stars: 0 },
    day:   { sky: ['#bfe7f7', '#8fd0ec', '#f2e4c2'], orb: '#fffdf4', orbGlow: '#fff3c4',
             sil: '#4a7a98', sil2: '#699ab5', ground: '#3d5f81', water: '#7fb8d4', stars: 0 },
    dusk:  { sky: ['#ffb27d', '#ec6f9d', '#5d3a92'], orb: '#ffedb3', orbGlow: '#ffb27d',
             sil: '#3a2563', sil2: '#54398a', ground: '#2c1c4e', water: '#b3557e', stars: 4 },
    night: { sky: ['#232b68', '#1a2151', '#0d1130'], orb: '#f2ecd0', orbGlow: '#8f97d8',
             sil: '#0b0e2a', sil2: '#161c45', ground: '#080a20', water: '#252e6e', stars: 26 },
  };

  /* deterministic per-spot randomness */
  function rng(id) {
    let h = 2166136261;
    for (const ch of String(id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => {
      h = Math.imul(h ^ (h >>> 15), 2246822519);
      h = Math.imul(h ^ (h >>> 13), 3266489917);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  const P = (pts) => pts.map((p) => p.join(',')).join(' ');

  /* ——— shared props ——— */
  function skyAndOrb(t, r) {
    const orbX = 120 + r() * 400, orbY = 60 + r() * 90;
    let s = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.sky[0]}"/><stop offset=".55" stop-color="${t.sky[1]}"/>
      <stop offset="1" stop-color="${t.sky[2]}"/></linearGradient>
      <radialGradient id="orbg"><stop offset="0" stop-color="${t.orbGlow}" stop-opacity=".8"/>
      <stop offset="1" stop-color="${t.orbGlow}" stop-opacity="0"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      <circle cx="${orbX}" cy="${orbY}" r="86" fill="url(#orbg)"/>
      <circle cx="${orbX}" cy="${orbY}" r="26" fill="${t.orb}"/>`;
    for (let i = 0; i < t.stars; i++) {
      s += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 190).toFixed(0)}" r="${(0.7 + r()).toFixed(1)}" fill="#e8ecff" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
    }
    // soft clouds
    for (let i = 0; i < 2 + Math.floor(r() * 2); i++) {
      const cx = r() * W, cy = 45 + r() * 110, w = 60 + r() * 80;
      s += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${w.toFixed(0)}" ry="${(w / 5).toFixed(0)}" fill="#ffffff" opacity="${t.stars > 10 ? 0.05 : 0.28}"/>`;
    }
    // birds
    for (let i = 0; i < 3; i++) {
      const bx = 60 + r() * 520, by = 70 + r() * 100;
      s += `<path d="M${bx - 8} ${by} Q${bx - 3} ${by - 6} ${bx} ${by} Q${bx + 3} ${by - 6} ${bx + 8} ${by}" stroke="${t.sil}" stroke-width="2" fill="none" opacity=".55"/>`;
    }
    return s;
  }

  const groundBand = (t) =>
    `<rect y="${GROUND}" width="${W}" height="${H - GROUND}" fill="${t.ground}"/>`;

  function waterBand(t, r) {
    let s = `<rect y="${GROUND}" width="${W}" height="${H - GROUND}" fill="${t.water}" opacity=".9"/>
      <rect y="${GROUND}" width="${W}" height="${H - GROUND}" fill="${t.ground}" opacity=".45"/>`;
    for (let i = 0; i < 9; i++) {
      const wx = r() * W, wy = GROUND + 12 + r() * 70, wl = 26 + r() * 60;
      s += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="${wl.toFixed(0)}" height="2.5" rx="1.2" fill="#ffffff" opacity="${(0.10 + r() * 0.16).toFixed(2)}"/>`;
    }
    return s;
  }

  function windows(t, x, y, w, h, r, step = 14) {
    let s = '';
    for (let yy = y + 10; yy < y + h - 8; yy += step) {
      for (let xx = x + 5; xx < x + w - 6; xx += 11) {
        if (r() < 0.36) s += `<rect x="${xx}" y="${yy}" width="4" height="6" fill="${t.orb}" opacity="${(0.25 + r() * 0.55).toFixed(2)}"/>`;
      }
    }
    return s;
  }

  const tower = (t, x, w, h, color) =>
    `<rect x="${x}" y="${GROUND - h}" width="${w}" height="${h}" fill="${color || t.sil}"/>`;

  function fireworks(r) {
    let s = '';
    const colors = ['#ffd166', '#f0abfc', '#7ae8d0'];
    for (let f = 0; f < 3; f++) {
      const fx = 90 + r() * 460, fy = 55 + r() * 80, rad = 22 + r() * 22;
      const col = colors[f % 3];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        s += `<line x1="${(fx + Math.cos(a) * 6).toFixed(0)}" y1="${(fy + Math.sin(a) * 6).toFixed(0)}" x2="${(fx + Math.cos(a) * rad).toFixed(0)}" y2="${(fy + Math.sin(a) * rad).toFixed(0)}" stroke="${col}" stroke-width="2" stroke-linecap="round" opacity=".85"/>`;
      }
      s += `<circle cx="${fx.toFixed(0)}" cy="${fy.toFixed(0)}" r="3" fill="${col}"/>`;
    }
    return s;
  }

  function palm(t, x, scale, flip) {
    const s = scale, dir = flip ? -1 : 1;
    let fronds = '';
    for (const [dx, dy] of [[-34, -12], [-26, -26], [-8, -32], [12, -28], [30, -16], [22, -2]]) {
      fronds += `<path d="M0 0 Q${dx * 0.5} ${dy - 8} ${dx} ${dy}" stroke="${t.sil}" stroke-width="${5 * s}" fill="none" stroke-linecap="round"/>`;
    }
    return `<g transform="translate(${x} ${GROUND}) scale(${dir * s} ${s})">
      <path d="M0 0 Q ${8} -30 4 -58" stroke="${t.sil}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <g transform="translate(4 -58)">${fronds}</g></g>`;
  }

  /* ——— scenes ——— */
  const SCENES = {
    /* Burj Khalifa + downtown cluster */
    downtown(t, r) {
      let s = groundBand(t);
      s += tower(t, 60, 46, 92, t.sil2) + windows(t, 60, GROUND - 92, 46, 92, r);
      s += tower(t, 118, 34, 128, t.sil2) + windows(t, 118, GROUND - 128, 34, 128, r);
      s += tower(t, 430, 52, 108, t.sil2) + windows(t, 430, GROUND - 108, 52, 108, r);
      s += tower(t, 498, 38, 148, t.sil2) + windows(t, 498, GROUND - 148, 38, 148, r);
      s += tower(t, 552, 46, 84, t.sil2) + windows(t, 552, GROUND - 84, 46, 84, r);
      // Burj Khalifa
      s += `<polygon points="${P([[320, 38], [306, 120], [296, 190], [284, GROUND], [356, GROUND], [344, 190], [334, 120]])}" fill="${t.sil}"/>
        <rect x="318" y="20" width="4" height="26" fill="${t.sil}"/>
        <polygon points="${P([[248, GROUND], [262, 178], [276, GROUND]])}" fill="${t.sil}"/>
        <polygon points="${P([[364, GROUND], [378, 168], [392, GROUND]])}" fill="${t.sil}"/>`;
      s += windows(t, 296, 130, 44, 130, r, 12);
      return s;
    },

    /* Burj Al Arab sail on the coast */
    coast(t, r) {
      let s = waterBand(t, r);
      s += `<g transform="translate(452 0)">
        <path d="M60 ${GROUND} L60 78 Q118 150 96 ${GROUND} Z" fill="${t.sil}"/>
        <path d="M60 96 Q30 170 44 ${GROUND} L60 ${GROUND} Z" fill="${t.sil2}"/>
        <rect x="57" y="60" width="4" height="30" fill="${t.sil}"/>
        <path d="M96 ${GROUND} L128 ${GROUND} L120 236 Z" fill="${t.sil2}"/>
      </g>`;
      s += palm(t, 92, 1.15, false) + palm(t, 150, 0.85, true);
      s += `<path d="M0 ${GROUND} Q80 ${GROUND - 16} 190 ${GROUND} Z" fill="${t.ground}"/>`;
      // sailboat
      s += `<g transform="translate(${(240 + r() * 120).toFixed(0)} ${GROUND + 34})">
        <path d="M-20 8 L20 8 L12 14 L-14 14 Z" fill="${t.sil}"/>
        <path d="M0 8 L0 -22 L16 4 Z" fill="${t.orb}" opacity=".92"/></g>`;
      return s;
    },

    /* dense marina towers over water, one twisted */
    marina(t, r) {
      let s = '';
      const xs = [48, 108, 168, 236, 296, 372, 442, 512, 566];
      xs.forEach((x, i) => {
        const h = 90 + ((i * 53) % 100) + r() * 26, w = 40 + (i % 3) * 8;
        s += tower(t, x, w, h, i % 2 ? t.sil : t.sil2) + windows(t, x, GROUND - h, w, h, r);
      });
      // twisted tower (Cayan-ish)
      let tw = '';
      for (let i = 0; i < 11; i++) {
        const y = GROUND - 16 - i * 16, off = Math.sin(i / 10 * Math.PI) * 15;
        tw += `<rect x="${330 + off}" y="${y}" width="42" height="13" rx="4" fill="${t.sil}"/>`;
      }
      s += tw + waterBand(t, r);
      return s;
    },

    /* wind-tower houses, dome + minaret (old Dubai) */
    oldtown(t, r) {
      let s = groundBand(t);
      const house = (x, w, h, c) => {
        let g = `<rect x="${x}" y="${GROUND - h}" width="${w}" height="${h}" fill="${c}"/>`;
        // barjeel wind tower
        const bx = x + w / 2 - 13;
        g += `<rect x="${bx}" y="${GROUND - h - 34}" width="26" height="34" fill="${c}"/>
          <line x1="${bx + 13}" y1="${GROUND - h - 32}" x2="${bx + 13}" y2="${GROUND - h - 2}" stroke="${t.sky[2]}" stroke-width="3"/>
          <line x1="${bx + 2}" y1="${GROUND - h - 30}" x2="${bx + 24}" y2="${GROUND - h - 30}" stroke="${t.sky[2]}" stroke-width="0" />
          <rect x="${bx - 3}" y="${GROUND - h - 38}" width="32" height="5" fill="${c}"/>`;
        // door + windows
        g += `<rect x="${x + w / 2 - 8}" y="${GROUND - 26}" width="16" height="26" rx="8" fill="${t.sky[2]}" opacity=".55"/>`;
        for (let wx = x + 10; wx < x + w - 12; wx += 24)
          g += `<rect x="${wx}" y="${GROUND - h + 14}" width="9" height="12" rx="4" fill="${t.orb}" opacity=".5"/>`;
        return g;
      };
      s += house(40, 96, 78, t.sil2) + house(150, 120, 98, t.sil) + house(286, 88, 70, t.sil2);
      // mosque dome + minaret
      s += `<circle cx="472" cy="${GROUND - 66}" r="34" fill="${t.sil}"/>
        <rect x="430" y="${GROUND - 62}" width="84" height="62" fill="${t.sil}"/>
        <rect x="466" y="${GROUND - 108}" width="12" height="14" fill="${t.sil}"/>
        <circle cx="472" cy="${GROUND - 112}" r="5" fill="${t.sil}"/>
        <rect x="540" y="${GROUND - 128}" width="14" height="128" fill="${t.sil2}"/>
        <circle cx="547" cy="${GROUND - 134}" r="8" fill="${t.sil2}"/>`;
      // bunting between houses
      s += `<path d="M60 ${GROUND - 130} Q220 ${GROUND - 96} 380 ${GROUND - 140}" stroke="${t.sil2}" stroke-width="2" fill="none"/>`;
      for (let i = 0; i < 9; i++) {
        const fx = 76 + i * 36, fy = GROUND - 128 + Math.sin(i / 8 * Math.PI) * 30;
        s += `<polygon points="${P([[fx, fy], [fx + 10, fy], [fx + 5, fy + 11]])}" fill="${['#ffd166', '#f0abfc', '#7ae8d0'][i % 3]}" opacity=".9"/>`;
      }
      return s;
    },

    /* palms + dunes */
    park(t, r) {
      let s = groundBand(t);
      s += `<path d="M0 ${GROUND} Q160 ${GROUND - 44} 340 ${GROUND} T680 ${GROUND} V${H} H0 Z" fill="${t.sil2}" opacity=".55"/>
        <path d="M120 ${GROUND} Q300 ${GROUND - 30} 520 ${GROUND} V${H} H120 Z" fill="${t.ground}"/>`;
      s += palm(t, 120, 1.3, false) + palm(t, 210, 0.9, true) + palm(t, 508, 1.1, true) + palm(t, 566, 0.8, false);
      // picnic blanket + kite
      s += `<rect x="300" y="${GROUND + 26}" width="64" height="30" rx="4" fill="${t.orb}" opacity=".8" transform="skewX(-14)"/>`;
      const kx = 380 + r() * 120, ky = 70 + r() * 40;
      s += `<polygon points="${P([[kx, ky], [kx + 16, ky + 14], [kx, ky + 30], [kx - 16, ky + 14]])}" fill="#f0abfc"/>
        <path d="M${kx} ${ky + 30} Q${kx - 24} ${ky + 74} ${kx - 10} ${GROUND - 40}" stroke="${t.sil}" stroke-width="1.6" fill="none"/>`;
      return s;
    },

    /* Ain Dubai ferris wheel + funfair */
    rides(t, r) {
      let s = groundBand(t);
      const cx = 452, cy = 150, R2 = 86;
      let spokes = '';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const px = cx + Math.cos(a) * R2, py = cy + Math.sin(a) * R2;
        spokes += `<line x1="${cx}" y1="${cy}" x2="${px.toFixed(0)}" y2="${py.toFixed(0)}" stroke="${t.sil2}" stroke-width="2.5"/>
          <circle cx="${px.toFixed(0)}" cy="${py.toFixed(0)}" r="7" fill="${['#ffd166', '#f0abfc', '#7ae8d0'][i % 3]}"/>`;
      }
      s += `<circle cx="${cx}" cy="${cy}" r="${R2}" fill="none" stroke="${t.sil}" stroke-width="5"/>${spokes}
        <circle cx="${cx}" cy="${cy}" r="10" fill="${t.sil}"/>
        <polygon points="${P([[cx - 34, GROUND], [cx, cy + 6], [cx + 34, GROUND]])}" fill="${t.sil}"/>`;
      // big top tent
      s += `<polygon points="${P([[96, GROUND], [110, 172], [196, 172], [210, GROUND]])}" fill="${t.sil2}"/>
        <polygon points="${P([[92, 178], [153, 128], [214, 178]])}" fill="${t.sil}"/>
        <line x1="153" y1="128" x2="153" y2="108" stroke="${t.sil}" stroke-width="3"/>
        <polygon points="${P([[153, 108], [175, 114], [153, 122]])}" fill="#ffd166"/>`;
      s += fireworks(r);
      return s;
    },
  };

  const FALLBACK_BY_CAT = {
    food: ['oldtown', 'dusk'], event: ['rides', 'night'], fun: ['rides', 'day'],
    chill: ['park', 'day'], culture: ['oldtown', 'day'],
  };

  function coverSVG(spot) {
    const fb = FALLBACK_BY_CAT[spot.cat] || ['downtown', 'dusk'];
    const scene = SCENES[spot.scene] ? spot.scene : fb[0];
    const t = TONES[spot.tone] || TONES[fb[1]];
    const r = rng(spot.id);
    let s = skyAndOrb(t, r);
    s += SCENES[scene](t, r);
    // emoji watermark, bottom-right
    s += `<text x="${W - 26}" y="${H - 20}" font-size="88" text-anchor="end" opacity="0.16">${spot.emoji}</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${(spot.name || '').replace(/"/g, '&quot;')} cover art">${s}</svg>`;
  }

  return { coverSVG };
})();
