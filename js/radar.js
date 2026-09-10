/* Radar view — every nearby spot as a blip by true bearing + distance.
   Pure canvas + local math: works with zero connectivity, no map tiles,
   no API keys. Friend discoveries land as expanding pings. */

const Radar = (() => {
  let canvas, ctx, dpr = 1, size = 0;
  let rafId = null;
  let getData = null;   // () => ({ spots: [{spot, dist, bearing, saved}], maxRange })
  let onTap = null;     // (spotId) => void
  let hitboxes = [];    // { x, y, id } in CSS px, rebuilt each frame
  let pings = [];       // { bearing, dist, start }

  function init(canvasEl, dataFn, tapFn) {
    canvas = canvasEl; getData = dataFn; onTap = tapFn;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('click', click);
  }

  function resize() {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    size = Math.min(rect.width, 520);
    dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
  }

  function start() { if (!rafId) rafId = requestAnimationFrame(frame); }
  function stop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  function addPing(dist, bearing) {
    pings.push({ dist, bearing, start: performance.now() });
    if (pings.length > 8) pings.shift();
  }

  function polar(cx, cy, R, dist, bearing, maxRange) {
    const r = (dist / maxRange) * R;
    return [cx + Math.sin(bearing) * r, cy - Math.cos(bearing) * r];
  }

  function frame(t) {
    rafId = requestAnimationFrame(frame);
    if (!getData) return;
    const { spots, maxRange } = getData();
    const cx = size / 2, cy = size / 2, R = size / 2 - 26;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    // Background disc
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    bg.addColorStop(0, 'rgba(45,212,191,0.08)');
    bg.addColorStop(1, 'rgba(45,212,191,0.01)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    // Rings + labels
    ctx.strokeStyle = 'rgba(94,234,212,0.22)';
    ctx.fillStyle = 'rgba(148,163,184,0.75)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    for (const f of [1 / 3, 2 / 3, 1]) {
      ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, Math.PI * 2); ctx.stroke();
      const km = maxRange * f;
      const label = km < 1 ? Math.round(km * 1000) + ' m' : (km < 10 ? km.toFixed(1) : Math.round(km)) + ' km';
      ctx.fillText(label, cx + 4, cy - R * f + 12);
    }
    // Crosshair + North
    ctx.beginPath();
    ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
    ctx.strokeStyle = 'rgba(94,234,212,0.10)'; ctx.stroke();
    ctx.fillStyle = 'rgba(94,234,212,0.8)';
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('N', cx, cy - R - 8);

    // Sweep
    const sweep = ((t / 3600) % (Math.PI * 2));
    const grad = ctx.createConicGradient
      ? ctx.createConicGradient(sweep - Math.PI / 2, cx, cy)
      : null;
    if (grad) {
      grad.addColorStop(0, 'rgba(45,212,191,0.35)');
      grad.addColorStop(0.12, 'rgba(45,212,191,0.0)');
      grad.addColorStop(1, 'rgba(45,212,191,0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.sin(sweep) * R, cy - Math.cos(sweep) * R);
    ctx.strokeStyle = 'rgba(45,212,191,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.lineWidth = 1;

    // Pings (friend discoveries)
    const now = performance.now();
    pings = pings.filter((p) => now - p.start < 2600);
    for (const p of pings) {
      if (p.dist > maxRange) continue;
      const [x, y] = polar(cx, cy, R, p.dist, p.bearing, maxRange);
      const age = (now - p.start) / 2600;
      ctx.beginPath(); ctx.arc(x, y, 6 + age * 34, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(240,171,252,${0.75 * (1 - age)})`;
      ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
    }

    // Blips
    hitboxes = [];
    const inRange = spots.filter((s) => s.dist <= maxRange);
    const labelled = new Set(inRange.slice().sort((a, b) => a.dist - b.dist).slice(0, 6).map((s) => s.spot.id));
    const drawnLabels = []; // avoid stacking labels on a dense cluster
    for (const s of inRange) {
      const [x, y] = polar(cx, cy, R, s.dist, s.bearing, maxRange);
      const color = CATEGORIES[s.spot.cat]?.color || '#5eead2';
      // brighten as the sweep passes
      let d = Math.atan2(Math.sin(s.bearing - sweep), Math.cos(s.bearing - sweep));
      const boost = Math.max(0, 1 - Math.abs(d) / 0.9);
      const pulse = 0.65 + 0.35 * Math.sin(t / 500 + s.dist * 7);

      ctx.beginPath(); ctx.arc(x, y, 9 + boost * 5, 0, Math.PI * 2);
      ctx.fillStyle = hexA(color, 0.14 + boost * 0.25); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = hexA(color, pulse); ctx.fill();
      if (s.saved) {
        ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(251,113,133,0.9)'; ctx.stroke();
      }
      if (labelled.has(s.spot.id)) {
        const ly = y - 12;
        if (!drawnLabels.some((p) => Math.abs(p.x - x) < 80 && Math.abs(p.y - ly) < 13)) {
          ctx.font = '10px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(226,232,240,0.85)';
          ctx.fillText(s.spot.emoji + ' ' + s.spot.name, x, ly);
          drawnLabels.push({ x, y: ly });
        }
      }
      hitboxes.push({ x, y, id: s.spot.id });
    }

    // You
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#5eead2'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 9 + 3 * Math.sin(t / 400), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(94,234,212,0.5)'; ctx.stroke();
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function click(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    let best = null, bestD = 22;
    for (const h of hitboxes) {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < bestD) { bestD = d; best = h; }
    }
    if (best && onTap) onTap(best.id);
  }

  return { init, start, stop, addPing, resize };
})();
